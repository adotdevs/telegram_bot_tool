import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const telegramAccountSchema = new Schema(
  {
    label: { type: String, trim: true },
    phoneNumber: { type: String, required: true, index: true },
    /** AES-GCM encrypted GramJS StringSession */
    sessionEncrypted: { type: String, required: true },
    proxyUrl: { type: String, trim: true },
    warmUpMode: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "paused", "flood_wait", "peer_flood_risky", "disabled"],
      default: "active",
    },
    floodWaitUntil: { type: Date },
    peerFloodMarkedAt: { type: Date },
    /** Rolling hourly windows (UTC hour bucket) */
    rateWindowHour: { type: Number, default: -1 },
    addsInWindow: { type: Number, default: 0 },
    dmsInWindow: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type TelegramAccountDoc = InferSchemaType<typeof telegramAccountSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TelegramAccount: Model<TelegramAccountDoc> =
  mongoose.models.TelegramAccount ??
  mongoose.model<TelegramAccountDoc>("TelegramAccount", telegramAccountSchema);
