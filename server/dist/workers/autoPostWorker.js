import { AutoPostSchedule } from "../models/AutoPostSchedule.js";
import { TelegramAccount } from "../models/TelegramAccount.js";
import { logAction } from "../services/logger.js";
import { postToGroup } from "../services/groupActions.js";
import { enqueueAutoPost } from "../queues/setup.js";
import { createClientForAccount } from "../telegram/gramClient.js";
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function handleAutoPost(job) {
    const schedule = await AutoPostSchedule.findById(job.data.scheduleId);
    if (!schedule)
        return;
    // If paused or draft, do not run
    if (schedule.status !== "active")
        return;
    const groups = (schedule.targetGroups ?? []).map((g) => g.trim()).filter(Boolean);
    if (groups.length === 0) {
        schedule.lastLog = "Skipped: No target groups specified";
        await schedule.save();
        return;
    }
    // Find active accounts assigned or available
    let accounts = [];
    if (schedule.accountIds && schedule.accountIds.length > 0) {
        accounts = await TelegramAccount.find({
            _id: { $in: schedule.accountIds },
            status: "active",
            sessionEncrypted: { $exists: true, $ne: "" },
        });
    }
    if (accounts.length === 0) {
        // Fallback to any active account
        accounts = await TelegramAccount.find({
            status: "active",
            sessionEncrypted: { $exists: true, $ne: "" },
        });
    }
    if (accounts.length === 0) {
        schedule.lastLog = "Error: No active Telegram account linked";
        schedule.recentLogs.unshift({
            timestamp: new Date(),
            group: "All",
            accountPhone: "None",
            status: "failed",
            message: "No active Telegram account available to post.",
        });
        if (schedule.recentLogs.length > 30)
            schedule.recentLogs.pop();
        await schedule.save();
        return;
    }
    let successCount = 0;
    let failCount = 0;
    let accountIdx = 0;
    console.log(`[auto-post] Starting wave for: "${schedule.name}" with ${groups.length} group(s)`);
    schedule.lastLog = `Processing ${groups.length} group(s)...`;
    await schedule.save();
    const clientMap = new Map();
    try {
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const account = accounts[accountIdx % accounts.length];
            accountIdx++;
            console.log(`[auto-post] [${schedule.name}] (${i + 1}/${groups.length}) Posting to: ${group} via ${account.phoneNumber}`);
            const accId = account._id.toString();
            let client = clientMap.get(accId);
            if (!client || !client.connected) {
                client = await createClientForAccount(account);
                await Promise.race([
                    client.connect(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Telegram connection timeout (25s)")), 25000)),
                ]);
                clientMap.set(accId, client);
            }
            try {
                const res = await postToGroup(account, group, schedule.messageTemplate, {
                    autoJoin: schedule.autoJoinGroups,
                    useAi: schedule.useAiVariations,
                    clientRef: client,
                });
                if (res.ok) {
                    successCount++;
                    console.log(`[auto-post] [${schedule.name}] Success in: ${group}`);
                    schedule.recentLogs.unshift({
                        timestamp: new Date(),
                        group,
                        accountPhone: account.phoneNumber,
                        status: "success",
                        message: `Posted successfully (msg id: ${res.messageId ?? "ok"})`,
                    });
                }
                else {
                    failCount++;
                    console.warn(`[auto-post] [${schedule.name}] Group issue: ${group} -> ${res.error}`);
                    schedule.recentLogs.unshift({
                        timestamp: new Date(),
                        group,
                        accountPhone: account.phoneNumber,
                        status: res.skipped ? "skipped" : "failed",
                        message: res.error,
                    });
                }
            }
            catch (err) {
                failCount++;
                const msg = err instanceof Error ? err.message : String(err);
                console.error(`[auto-post] [${schedule.name}] Error posting to: ${group} ->`, msg);
                schedule.recentLogs.unshift({
                    timestamp: new Date(),
                    group,
                    accountPhone: account.phoneNumber,
                    status: "failed",
                    message: msg,
                });
            }
            // Keep only last 30 logs
            while (schedule.recentLogs.length > 30) {
                schedule.recentLogs.pop();
            }
            // Delay between posting to different groups
            if (i < groups.length - 1) {
                const delayMs = Math.max(2, schedule.delayBetweenGroupsSeconds || 10) * 1000;
                await sleep(delayMs);
            }
        }
    }
    finally {
        for (const c of clientMap.values()) {
            try {
                await c.disconnect();
            }
            catch { }
        }
    }
    // Update schedule stats & next run time atomically
    const now = new Date();
    const nextIntervalMs = Math.max(1, schedule.intervalMinutes || 60) * 60 * 1000;
    const nextRun = new Date(now.getTime() + nextIntervalMs);
    const statusMsg = `Finished wave: ${successCount} sent, ${failCount} failed. Next in ${schedule.intervalMinutes}m.`;
    await AutoPostSchedule.findByIdAndUpdate(schedule._id, {
        lastRunAt: now,
        nextRunAt: nextRun,
        lastLog: statusMsg,
        $inc: {
            "stats.totalRuns": 1,
            "stats.totalPosts": groups.length,
            "stats.successfulPosts": successCount,
            "stats.failedPosts": failCount,
        },
        $set: {
            recentLogs: schedule.recentLogs.slice(0, 30),
        },
    });
    await logAction({
        action: "send_message",
        message: `Auto-Post [${schedule.name}]: ${successCount} sent, ${failCount} failed`,
        meta: { scheduleId: schedule._id, successCount, failCount },
    });
    // Re-enqueue next wave if still active
    if (schedule.status === "active") {
        await enqueueAutoPost(schedule._id.toString(), nextIntervalMs);
    }
}
/**
 * On worker restart, re-enqueue any active schedules that are pending or due.
 */
export async function resumeActiveAutoPostSchedules() {
    try {
        const active = await AutoPostSchedule.find({ status: "active" });
        const now = Date.now();
        for (const item of active) {
            let delay = 5000;
            if (item.nextRunAt) {
                const diff = item.nextRunAt.getTime() - now;
                delay = diff > 0 ? diff : 5000;
            }
            await enqueueAutoPost(item._id.toString(), delay);
            console.log(`[auto-post] Scheduled ${item.name} in ${Math.round(delay / 1000)}s`);
        }
    }
    catch (err) {
        console.error("[auto-post] Failed to resume schedules:", err);
    }
}
//# sourceMappingURL=autoPostWorker.js.map