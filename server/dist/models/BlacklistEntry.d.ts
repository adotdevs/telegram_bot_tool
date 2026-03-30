import mongoose, { type InferSchemaType, type Model } from "mongoose";
declare const blacklistSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    telegramId: string;
    reason?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    telegramId: string;
    reason?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    telegramId: string;
    reason?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type BlacklistEntryDoc = InferSchemaType<typeof blacklistSchema> & {
    _id: mongoose.Types.ObjectId;
};
export declare const BlacklistEntry: Model<BlacklistEntryDoc>;
export {};
//# sourceMappingURL=BlacklistEntry.d.ts.map