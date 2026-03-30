import { Campaign } from "../models/Campaign.js";
import { CampaignUser } from "../models/CampaignUser.js";
import { BlacklistEntry } from "../models/BlacklistEntry.js";
import { TelegramAccount } from "../models/TelegramAccount.js";
import { pickAccount, markFloodWait, markPeerFloodRisky } from "../services/accountPicker.js";
import { recordAdd, recordDm } from "../services/rateLimit.js";
import { logAction } from "../services/logger.js";
import { addUserToTargetGroup, scrapeGroupParticipants, sendDirectMessage } from "../services/telegramActions.js";
import { nextActionDelayMs, longPauseMs, typingDelayMsForText, sleep, actionsBeforeLongPause, } from "../services/antiBan.js";
import { buildMessageText } from "../services/messageVariator.js";
import { getRuntimeSettings } from "../services/runtimeSettings.js";
import { addUserQueue, enqueueCampaignTick, sendMessageQueue } from "../queues/setup.js";
function statsOf(campaign) {
    if (!campaign.stats) {
        campaign.stats = {
            scraped: 0,
            added: 0,
            messaged: 0,
            failed: 0,
            skipped: 0,
        };
    }
    if (campaign.stats.skipped === undefined)
        campaign.stats.skipped = 0;
    return campaign.stats;
}
let actionCounter = 0;
let untilLongPause = 0;
let burstRangeReady = false;
async function maybeIdleBurst() {
    const runtime = await getRuntimeSettings();
    if (!burstRangeReady) {
        untilLongPause = actionsBeforeLongPause(runtime.actionsBeforeLongPauseMin, runtime.actionsBeforeLongPauseMax);
        burstRangeReady = true;
    }
    actionCounter += 1;
    if (actionCounter >= untilLongPause) {
        actionCounter = 0;
        untilLongPause = actionsBeforeLongPause(runtime.actionsBeforeLongPauseMin, runtime.actionsBeforeLongPauseMax);
        await sleep(longPauseMs());
    }
}
export async function handleScrape(job) {
    const { campaignId } = job.data;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign)
        throw new Error("Campaign not found");
    if (!campaign.sourceGroupUsername) {
        await logAction({
            campaignId: campaign._id,
            action: "scrape",
            level: "warn",
            success: false,
            message: "Scrape skipped: no source group",
        });
        await enqueueCampaignTick(campaignId, 3000);
        return;
    }
    const account = await pickAccount("add");
    if (!account) {
        await logAction({
            campaignId: campaign._id,
            action: "scrape",
            level: "warn",
            success: false,
            message: "No active Telegram account for scrape",
        });
        throw new Error("No account for scrape");
    }
    const res = await scrapeGroupParticipants(account, campaign.sourceGroupUsername);
    if ("kind" in res) {
        if (res.kind === "flood")
            await markFloodWait(account._id, res.seconds);
        if (res.kind === "peer_flood")
            await markPeerFloodRisky(account._id);
        await logAction({
            campaignId: campaign._id,
            telegramAccountId: account._id,
            action: "scrape",
            level: "error",
            success: false,
            message: `Scrape failed: ${JSON.stringify(res)}`,
        });
        throw new Error("scrape failed");
    }
    let newCount = 0;
    for (const u of res.users) {
        const bl = await BlacklistEntry.findOne({ telegramId: u.telegramId });
        if (bl)
            continue;
        try {
            const r = await CampaignUser.updateOne({ campaignId: campaign._id, telegramId: u.telegramId }, {
                $setOnInsert: {
                    campaignId: campaign._id,
                    telegramId: u.telegramId,
                    username: u.username,
                    accessHash: u.accessHash,
                    isBot: u.isBot,
                    status: "pending",
                },
            }, { upsert: true });
            if (r.upsertedCount)
                newCount += 1;
        }
        catch {
            /* duplicate */
        }
    }
    const st = statsOf(campaign);
    st.scraped = await CampaignUser.countDocuments({ campaignId: campaign._id });
    await campaign.save();
    await logAction({
        campaignId: campaign._id,
        action: "scrape",
        message: `Scraped: +${newCount} new (total ${st.scraped})`,
        meta: { newCount },
    });
    await enqueueCampaignTick(campaignId, nextActionDelayMs());
}
export async function handleAddUser(job) {
    const cu = await CampaignUser.findById(job.data.campaignUserId);
    if (!cu)
        return;
    const campaign = await Campaign.findById(cu.campaignId);
    if (!campaign || campaign.status !== "running")
        return;
    if (cu.status !== "queued" && cu.status !== "pending")
        return;
    if (cu.isBot) {
        cu.status = "skipped";
        cu.skipReason = "bot";
        await cu.save();
        statsOf(campaign).skipped += 1;
        await campaign.save();
        return;
    }
    const bl = await BlacklistEntry.findOne({ telegramId: cu.telegramId });
    if (bl) {
        cu.status = "skipped";
        cu.skipReason = "blacklist";
        await cu.save();
        return;
    }
    await maybeIdleBurst();
    await sleep(nextActionDelayMs());
    const account = await pickAccount("add");
    if (!account) {
        await addUserQueue.add("add", job.data, { delay: 60_000 });
        return;
    }
    const err = await addUserToTargetGroup(account, campaign, cu);
    if (err && "kind" in err) {
        if (err.kind === "privacy") {
            cu.status = "skipped";
            cu.skipReason = "privacy";
            await cu.save();
            statsOf(campaign).skipped += 1;
            await campaign.save();
            await logAction({
                campaignId: campaign._id,
                campaignUserId: cu._id,
                telegramAccountId: account._id,
                action: "add_user",
                level: "warn",
                success: false,
                message: "Cannot add (privacy / restrictions)",
            });
            return;
        }
        if (err.kind === "flood") {
            await markFloodWait(account._id, err.seconds);
            await logAction({
                campaignId: campaign._id,
                telegramAccountId: account._id,
                action: "add_user",
                level: "warn",
                success: false,
                message: `FLOOD_WAIT ${err.seconds}s`,
            });
            await addUserQueue.add("add", job.data, { delay: Math.min(err.seconds * 1000, 3_600_000) });
            return;
        }
        if (err.kind === "peer_flood") {
            await markPeerFloodRisky(account._id);
            await addUserQueue.add("add", job.data, { delay: 3_600_000 });
            return;
        }
        cu.status = "failed";
        cu.lastError = err.message;
        await cu.save();
        statsOf(campaign).failed += 1;
        await campaign.save();
        await logAction({
            campaignId: campaign._id,
            campaignUserId: cu._id,
            action: "add_user",
            level: "error",
            success: false,
            message: err.message,
        });
        return;
    }
    recordAdd(account);
    cu.status = "added";
    cu.assignedAccountId = account._id;
    await cu.save();
    await TelegramAccount.findByIdAndUpdate(account._id, {
        addsInWindow: account.addsInWindow,
        dmsInWindow: account.dmsInWindow,
        rateWindowHour: account.rateWindowHour,
    });
    statsOf(campaign).added += 1;
    await campaign.save();
    await logAction({
        campaignId: campaign._id,
        campaignUserId: cu._id,
        telegramAccountId: account._id,
        action: "add_user",
        message: "User invited to target group",
    });
    await sendMessageQueue.add("send", { campaignUserId: cu._id.toString() }, { delay: nextActionDelayMs() + 3000 });
}
export async function handleSendMessage(job) {
    const cu = await CampaignUser.findById(job.data.campaignUserId);
    if (!cu)
        return;
    const campaign = await Campaign.findById(cu.campaignId);
    if (!campaign || campaign.status !== "running")
        return;
    if (cu.status !== "added")
        return;
    if (cu.isBot)
        return;
    const runtime = await getRuntimeSettings();
    if (Math.random() > runtime.dmProbability) {
        cu.status = "skipped";
        cu.skipReason = "probabilistic_skip";
        await cu.save();
        statsOf(campaign).skipped += 1;
        await campaign.save();
        return;
    }
    if (campaign.onlyActiveUsers && !cu.lastSeenAvailable) {
        if (Math.random() > 0.3) {
            cu.status = "skipped";
            cu.skipReason = "inactive_gate";
            await cu.save();
            statsOf(campaign).skipped += 1;
            await campaign.save();
            return;
        }
    }
    await maybeIdleBurst();
    const assigned = cu.assignedAccountId != null ? await TelegramAccount.findById(cu.assignedAccountId) : null;
    const account = assigned && assigned.status === "active" ? assigned : await pickAccount("dm");
    if (!account?.sessionEncrypted) {
        await sendMessageQueue.add("send", job.data, { delay: 120_000 });
        return;
    }
    const firstName = cu.username || "there";
    const text = await buildMessageText(campaign.messageTemplate, { first_name: firstName, username: firstName }, campaign.useAiVariations ?? false);
    const typingMs = typingDelayMsForText(text);
    await sleep(nextActionDelayMs());
    const err = await sendDirectMessage(account, cu, text, typingMs);
    if (err && "kind" in err) {
        if (err.kind === "privacy") {
            cu.status = "skipped";
            cu.skipReason = "privacy_dm";
            await cu.save();
            statsOf(campaign).skipped += 1;
            await campaign.save();
            return;
        }
        if (err.kind === "flood") {
            await markFloodWait(account._id, err.seconds);
            await sendMessageQueue.add("send", job.data, { delay: Math.min(err.seconds * 1000, 3_600_000) });
            return;
        }
        if (err.kind === "peer_flood") {
            await markPeerFloodRisky(account._id);
            await sendMessageQueue.add("send", job.data, { delay: 3_600_000 });
            return;
        }
        cu.lastError = err.message;
        await cu.save();
        statsOf(campaign).failed += 1;
        await campaign.save();
        return;
    }
    recordDm(account);
    await TelegramAccount.findByIdAndUpdate(account._id, {
        addsInWindow: account.addsInWindow,
        dmsInWindow: account.dmsInWindow,
        rateWindowHour: account.rateWindowHour,
    });
    cu.status = "messaged";
    await cu.save();
    statsOf(campaign).messaged += 1;
    await campaign.save();
    await logAction({
        campaignId: campaign._id,
        campaignUserId: cu._id,
        telegramAccountId: account._id,
        action: "send_message",
        message: "DM sent",
    });
}
export async function handleCampaignTick(job) {
    const campaign = await Campaign.findById(job.data.campaignId);
    if (!campaign || campaign.status !== "running")
        return;
    const rs = await getRuntimeSettings();
    const wave = Math.min(campaign.batchSize ?? 75, rs.batchSizeMax, rs.campaignMaxParallel);
    const claimed = [];
    for (let i = 0; i < wave; i++) {
        const doc = await CampaignUser.findOneAndUpdate({ campaignId: campaign._id, status: "pending" }, { $set: { status: "queued" } }, { sort: { createdAt: 1 }, new: true });
        if (!doc)
            break;
        claimed.push(doc);
    }
    if (claimed.length === 0) {
        const unfinished = await CampaignUser.countDocuments({
            campaignId: campaign._id,
            status: { $in: ["pending", "queued", "added"] },
        });
        if (unfinished === 0 && campaign.status === "running") {
            campaign.status = "completed";
            await campaign.save();
            await logAction({
                campaignId: campaign._id,
                action: "orchestrate",
                message: "Campaign completed",
            });
        }
        return;
    }
    let stagger = nextActionDelayMs();
    for (const u of claimed) {
        await addUserQueue.add("add", { campaignUserId: u._id.toString() }, { delay: stagger });
        stagger += nextActionDelayMs();
    }
    await logAction({
        campaignId: campaign._id,
        action: "orchestrate",
        message: `Queued ${claimed.length} add job(s)`,
        meta: { count: claimed.length },
    });
    const gap = nextActionDelayMs() + Math.floor(longPauseMs() / 6);
    await enqueueCampaignTick(campaign._id.toString(), gap);
}
//# sourceMappingURL=handlers.js.map