import mongoose, { Schema } from "mongoose";
const actionLogSchema = new Schema({
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
    campaignUserId: { type: Schema.Types.ObjectId, ref: "CampaignUser" },
    telegramAccountId: { type: Schema.Types.ObjectId, ref: "TelegramAccount" },
    action: {
        type: String,
        enum: ["scrape", "add_user", "send_message", "orchestrate", "login", "other"],
        required: true,
    },
    level: { type: String, enum: ["info", "warn", "error"], default: "info" },
    success: { type: Boolean, default: true },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
}, { timestamps: true });
actionLogSchema.index({ createdAt: -1 });
export const ActionLog = mongoose.models.ActionLog ?? mongoose.model("ActionLog", actionLogSchema);
//# sourceMappingURL=ActionLog.js.map