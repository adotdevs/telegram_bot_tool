import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const campaignUserSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    telegramId: { type: String, required: true, index: true },
    username: { type: String, trim: true },
    accessHash: { type: String },
    isBot: { type: Boolean, default: false },
    lastSeenAvailable: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "queued", "added", "messaged", "failed", "skipped"],
      default: "pending",
      index: true,
    },
    skipReason: { type: String },
    assignedAccountId: { type: Schema.Types.ObjectId, ref: "TelegramAccount" },
    lastError: { type: String },
  },
  { timestamps: true }
);

campaignUserSchema.index({ campaignId: 1, telegramId: 1 }, { unique: true });

export type CampaignUserDoc = InferSchemaType<typeof campaignUserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CampaignUser: Model<CampaignUserDoc> =
  mongoose.models.CampaignUser ?? mongoose.model<CampaignUserDoc>("CampaignUser", campaignUserSchema);
