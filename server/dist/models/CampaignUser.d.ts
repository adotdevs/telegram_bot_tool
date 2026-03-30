import mongoose, { type InferSchemaType, type Model } from "mongoose";
declare const campaignUserSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "added" | "messaged" | "failed" | "skipped" | "pending" | "queued";
    campaignId: mongoose.Types.ObjectId;
    telegramId: string;
    isBot: boolean;
    lastSeenAvailable: boolean;
    username?: string | null | undefined;
    accessHash?: string | null | undefined;
    skipReason?: string | null | undefined;
    assignedAccountId?: mongoose.Types.ObjectId | null | undefined;
    lastError?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "added" | "messaged" | "failed" | "skipped" | "pending" | "queued";
    campaignId: mongoose.Types.ObjectId;
    telegramId: string;
    isBot: boolean;
    lastSeenAvailable: boolean;
    username?: string | null | undefined;
    accessHash?: string | null | undefined;
    skipReason?: string | null | undefined;
    assignedAccountId?: mongoose.Types.ObjectId | null | undefined;
    lastError?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "added" | "messaged" | "failed" | "skipped" | "pending" | "queued";
    campaignId: mongoose.Types.ObjectId;
    telegramId: string;
    isBot: boolean;
    lastSeenAvailable: boolean;
    username?: string | null | undefined;
    accessHash?: string | null | undefined;
    skipReason?: string | null | undefined;
    assignedAccountId?: mongoose.Types.ObjectId | null | undefined;
    lastError?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type CampaignUserDoc = InferSchemaType<typeof campaignUserSchema> & {
    _id: mongoose.Types.ObjectId;
};
export declare const CampaignUser: Model<CampaignUserDoc>;
export {};
//# sourceMappingURL=CampaignUser.d.ts.map