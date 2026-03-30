import { ActionLog } from "../models/ActionLog.js";
export async function logAction(params) {
    await ActionLog.create({
        campaignId: params.campaignId,
        campaignUserId: params.campaignUserId,
        telegramAccountId: params.telegramAccountId,
        action: params.action,
        level: params.level ?? "info",
        success: params.success ?? true,
        message: params.message,
        meta: params.meta,
    });
}
//# sourceMappingURL=logger.js.map