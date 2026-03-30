import mongoose, { type InferSchemaType, type Model } from "mongoose";
/** Single-row app configuration (dashboard-editable). Empty fields fall back to .env defaults. */
declare const appSettingsSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    _id: string;
    telegramApiId?: number | null | undefined;
    telegramApiHash?: string | null | undefined;
    openaiApiKey?: string | null | undefined;
    openaiModel?: string | null | undefined;
    maxAddsPerHour?: number | null | undefined;
    maxDmsPerHour?: number | null | undefined;
    dmProbability?: number | null | undefined;
    batchSizeMax?: number | null | undefined;
    campaignMaxParallel?: number | null | undefined;
    actionsBeforeLongPauseMin?: number | null | undefined;
    actionsBeforeLongPauseMax?: number | null | undefined;
    extraWebOrigins?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    _id: string;
    telegramApiId?: number | null | undefined;
    telegramApiHash?: string | null | undefined;
    openaiApiKey?: string | null | undefined;
    openaiModel?: string | null | undefined;
    maxAddsPerHour?: number | null | undefined;
    maxDmsPerHour?: number | null | undefined;
    dmProbability?: number | null | undefined;
    batchSizeMax?: number | null | undefined;
    campaignMaxParallel?: number | null | undefined;
    actionsBeforeLongPauseMin?: number | null | undefined;
    actionsBeforeLongPauseMax?: number | null | undefined;
    extraWebOrigins?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    _id: string;
    telegramApiId?: number | null | undefined;
    telegramApiHash?: string | null | undefined;
    openaiApiKey?: string | null | undefined;
    openaiModel?: string | null | undefined;
    maxAddsPerHour?: number | null | undefined;
    maxDmsPerHour?: number | null | undefined;
    dmProbability?: number | null | undefined;
    batchSizeMax?: number | null | undefined;
    campaignMaxParallel?: number | null | undefined;
    actionsBeforeLongPauseMin?: number | null | undefined;
    actionsBeforeLongPauseMax?: number | null | undefined;
    extraWebOrigins?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export type AppSettingsDoc = InferSchemaType<typeof appSettingsSchema>;
export declare const AppSettings: Model<AppSettingsDoc>;
export {};
//# sourceMappingURL=AppSettings.d.ts.map