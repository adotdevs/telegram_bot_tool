import type { Types } from "mongoose";
export declare function logAction(params: {
    campaignId?: Types.ObjectId;
    campaignUserId?: Types.ObjectId;
    telegramAccountId?: Types.ObjectId;
    action: "scrape" | "add_user" | "send_message" | "orchestrate" | "login" | "other";
    level?: "info" | "warn" | "error";
    success?: boolean;
    message: string;
    meta?: Record<string, unknown>;
}): Promise<void>;
//# sourceMappingURL=logger.d.ts.map