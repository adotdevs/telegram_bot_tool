import mongoose, { type InferSchemaType, type Model } from "mongoose";
declare const campaignSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "paused" | "draft" | "running" | "completed";
    name: string;
    batchSize: number;
    messageTemplate: string;
    useAiVariations: boolean;
    onlyActiveUsers: boolean;
    sourceGroupUsername?: string | null | undefined;
    targetGroupUsername?: string | null | undefined;
    targetGroupLink?: string | null | undefined;
    stats?: {
        scraped: number;
        added: number;
        messaged: number;
        failed: number;
        skipped: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "paused" | "draft" | "running" | "completed";
    name: string;
    batchSize: number;
    messageTemplate: string;
    useAiVariations: boolean;
    onlyActiveUsers: boolean;
    sourceGroupUsername?: string | null | undefined;
    targetGroupUsername?: string | null | undefined;
    targetGroupLink?: string | null | undefined;
    stats?: {
        scraped: number;
        added: number;
        messaged: number;
        failed: number;
        skipped: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "paused" | "draft" | "running" | "completed";
    name: string;
    batchSize: number;
    messageTemplate: string;
    useAiVariations: boolean;
    onlyActiveUsers: boolean;
    sourceGroupUsername?: string | null | undefined;
    targetGroupUsername?: string | null | undefined;
    targetGroupLink?: string | null | undefined;
    stats?: {
        scraped: number;
        added: number;
        messaged: number;
        failed: number;
        skipped: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type CampaignDoc = InferSchemaType<typeof campaignSchema> & {
    _id: mongoose.Types.ObjectId;
};
export declare const Campaign: Model<CampaignDoc>;
export {};
//# sourceMappingURL=Campaign.d.ts.map