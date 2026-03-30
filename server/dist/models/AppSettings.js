import mongoose, { Schema } from "mongoose";
/** Single-row app configuration (dashboard-editable). Empty fields fall back to .env defaults. */
const appSettingsSchema = new Schema({
    _id: { type: String, default: "app", immutable: true },
    telegramApiId: { type: Number },
    telegramApiHash: { type: String, trim: true },
    openaiApiKey: { type: String, trim: true },
    openaiModel: { type: String, trim: true },
    maxAddsPerHour: { type: Number, min: 1, max: 30 },
    maxDmsPerHour: { type: Number, min: 1, max: 25 },
    dmProbability: { type: Number, min: 0, max: 1 },
    batchSizeMax: { type: Number, min: 1, max: 500 },
    campaignMaxParallel: { type: Number, min: 1, max: 25 },
    actionsBeforeLongPauseMin: { type: Number, min: 1, max: 50 },
    actionsBeforeLongPauseMax: { type: Number, min: 1, max: 50 },
    /** Extra allowed browser origins for CORS (comma-separated), in addition to WEB_ORIGIN in .env */
    extraWebOrigins: { type: String, trim: true },
}, { timestamps: true });
export const AppSettings = mongoose.models.AppSettings ?? mongoose.model("AppSettings", appSettingsSchema);
//# sourceMappingURL=AppSettings.js.map