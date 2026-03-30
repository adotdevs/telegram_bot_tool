import { TelegramAccount } from "../models/TelegramAccount.js";
import { canAdd, canDm } from "./rateLimit.js";
/** Pick an account that can perform `kind`, least recently used first */
export async function pickAccount(kind) {
    await TelegramAccount.updateMany({ status: "flood_wait", floodWaitUntil: { $lte: new Date() } }, { $set: { status: "active" }, $unset: { floodWaitUntil: 1 } });
    const accounts = await TelegramAccount.find({
        status: "active",
        $or: [{ floodWaitUntil: { $exists: false } }, { floodWaitUntil: { $lt: new Date() } }],
    }).sort({ updatedAt: 1 });
    for (const acc of accounts) {
        if (acc.floodWaitUntil && acc.floodWaitUntil > new Date())
            continue;
        if (kind === "add" && (await canAdd(acc)))
            return acc;
        if (kind === "dm" && (await canDm(acc)))
            return acc;
    }
    /** Fallback: any active not in flood if caps hit — still return null to delay job */
    return null;
}
export async function markFloodWait(accountId, seconds) {
    const until = new Date(Date.now() + seconds * 1000);
    await TelegramAccount.findByIdAndUpdate(accountId, {
        status: "flood_wait",
        floodWaitUntil: until,
    });
}
export async function markPeerFloodRisky(accountId) {
    await TelegramAccount.findByIdAndUpdate(accountId, {
        status: "peer_flood_risky",
        peerFloodMarkedAt: new Date(),
    });
}
export async function clearFloodWaitIfExpired(account) {
    if (account.status === "flood_wait" && account.floodWaitUntil && account.floodWaitUntil <= new Date()) {
        await TelegramAccount.findByIdAndUpdate(account._id, {
            status: "active",
            $unset: { floodWaitUntil: 1 },
        });
    }
}
//# sourceMappingURL=accountPicker.js.map