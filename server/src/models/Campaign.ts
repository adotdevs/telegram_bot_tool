import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const campaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "running", "paused", "completed"],
      default: "draft",
    },
    sourceGroupUsername: { type: String, trim: true },
    targetGroupUsername: { type: String, trim: true },
    targetGroupLink: { type: String, trim: true },
    messageTemplate: { type: String, required: true },
    batchSize: { type: Number, default: 75, min: 1, max: 500 },
    useAiVariations: { type: Boolean, default: false },
    onlyActiveUsers: { type: Boolean, default: false },
    stats: {
      scraped: { type: Number, default: 0 },
      added: { type: Number, default: 0 },
      messaged: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export type CampaignDoc = InferSchemaType<typeof campaignSchema> & { _id: mongoose.Types.ObjectId };

export const Campaign: Model<CampaignDoc> =
  mongoose.models.Campaign ?? mongoose.model<CampaignDoc>("Campaign", campaignSchema);
