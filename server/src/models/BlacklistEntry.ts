import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const blacklistSchema = new Schema(
  {
    telegramId: { type: String, required: true, unique: true, index: true },
    reason: { type: String, trim: true },
  },
  { timestamps: true }
);

export type BlacklistEntryDoc = InferSchemaType<typeof blacklistSchema> & { _id: mongoose.Types.ObjectId };

export const BlacklistEntry: Model<BlacklistEntryDoc> =
  mongoose.models.BlacklistEntry ?? mongoose.model<BlacklistEntryDoc>("BlacklistEntry", blacklistSchema);
