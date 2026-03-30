import mongoose, { Schema } from "mongoose";
const blacklistSchema = new Schema({
    telegramId: { type: String, required: true, unique: true, index: true },
    reason: { type: String, trim: true },
}, { timestamps: true });
export const BlacklistEntry = mongoose.models.BlacklistEntry ?? mongoose.model("BlacklistEntry", blacklistSchema);
//# sourceMappingURL=BlacklistEntry.js.map