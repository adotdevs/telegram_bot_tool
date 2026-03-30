import { ActionLog } from "../models/ActionLog.js";
import type { Types } from "mongoose";

export async function logAction(params: {
  campaignId?: Types.ObjectId;
  campaignUserId?: Types.ObjectId;
  telegramAccountId?: Types.ObjectId;
  action: "scrape" | "add_user" | "send_message" | "orchestrate" | "login" | "other";
  level?: "info" | "warn" | "error";
  success?: boolean;
  message: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
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
