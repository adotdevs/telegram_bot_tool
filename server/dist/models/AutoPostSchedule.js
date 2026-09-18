import mongoose, { Schema } from "mongoose";
const logItemSchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    group: { type: String, required: true },
    accountPhone: { type: String, default: "" },
    status: { type: String, enum: ["success", "failed", "skipped"], required: true },
    message: { type: String, default: "" },
}, { _id: false });
const autoPostScheduleSchema = new Schema({
    name: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ["active", "paused", "draft"],
        default: "active",
    },
    accountIds: [{ type: Schema.Types.ObjectId, ref: "TelegramAccount" }],
    targetGroups: [{ type: String, trim: true }],
    messageTemplate: { type: String, required: true },
    intervalMinutes: { type: Number, default: 60, min: 1 },
    useAiVariations: { type: Boolean, default: false },
    autoJoinGroups: { type: Boolean, default: true },
    delayBetweenGroupsSeconds: { type: Number, default: 12, min: 2, max: 120 },
    lastRunAt: { type: Date, default: null },
    nextRunAt: { type: Date, default: null },
    stats: {
        totalRuns: { type: Number, default: 0 },
        totalPosts: { type: Number, default: 0 },
        successfulPosts: { type: Number, default: 0 },
        failedPosts: { type: Number, default: 0 },
    },
    lastLog: { type: String, default: "" },
    recentLogs: { type: [logItemSchema], default: [] },
}, { timestamps: true });
export const AutoPostSchedule = mongoose.models.AutoPostSchedule ??
    mongoose.model("AutoPostSchedule", autoPostScheduleSchema);
//# sourceMappingURL=AutoPostSchedule.js.map