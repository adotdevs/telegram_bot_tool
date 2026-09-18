import mongoose, { type InferSchemaType, type Model } from "mongoose";
declare const autoPostScheduleSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "active" | "paused" | "draft";
    name: string;
    messageTemplate: string;
    useAiVariations: boolean;
    accountIds: mongoose.Types.ObjectId[];
    targetGroups: string[];
    intervalMinutes: number;
    autoJoinGroups: boolean;
    delayBetweenGroupsSeconds: number;
    lastLog: string;
    recentLogs: mongoose.Types.DocumentArray<{
        message: string;
        status: "success" | "failed" | "skipped";
        timestamp: NativeDate;
        group: string;
        accountPhone: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        message: string;
        status: "success" | "failed" | "skipped";
        timestamp: NativeDate;
        group: string;
        accountPhone: string;
    }> & {
        message: string;
        status: "success" | "failed" | "skipped";
        timestamp: NativeDate;
        group: string;
        accountPhone: string;
    }>;
    stats?: {
        totalRuns: number;
        totalPosts: number;
        successfulPosts: number;
        failedPosts: number;
    } | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    nextRunAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "active" | "paused" | "draft";
    name: string;
    messageTemplate: string;
    useAiVariations: boolean;
    accountIds: mongoose.Types.ObjectId[];
    targetGroups: string[];
    intervalMinutes: number;
    autoJoinGroups: boolean;
    delayBetweenGroupsSeconds: number;
    lastLog: string;
    recentLogs: mongoose.Types.DocumentArray<{
        message: string;
        status: "success" | "failed" | "skipped";
        timestamp: NativeDate;
        group: string;
        accountPhone: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        message: string;
        status: "success" | "failed" | "skipped";
        timestamp: NativeDate;
        group: string;
        accountPhone: string;
    }> & {
        message: string;
        status: "success" | "failed" | "skipped";
        timestamp: NativeDate;
        group: string;
        accountPhone: string;
    }>;
    stats?: {
        totalRuns: number;
        totalPosts: number;
        successfulPosts: number;
        failedPosts: number;
    } | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    nextRunAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "active" | "paused" | "draft";
    name: string;
    messageTemplate: string;
    useAiVariations: boolean;
    accountIds: mongoose.Types.ObjectId[];
    targetGroups: string[];
    intervalMinutes: number;
    autoJoinGroups: boolean;
    delayBetweenGroupsSeconds: number;
    lastLog: string;
    recentLogs: mongoose.Types.DocumentArray<{
        message: string;
        status: "success" | "failed" | "skipped";
        timestamp: NativeDate;
        group: string;
        accountPhone: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        message: string;
        status: "success" | "failed" | "skipped";
        timestamp: NativeDate;
        group: string;
        accountPhone: string;
    }> & {
        message: string;
        status: "success" | "failed" | "skipped";
        timestamp: NativeDate;
        group: string;
        accountPhone: string;
    }>;
    stats?: {
        totalRuns: number;
        totalPosts: number;
        successfulPosts: number;
        failedPosts: number;
    } | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    nextRunAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type AutoPostScheduleDoc = InferSchemaType<typeof autoPostScheduleSchema> & {
    _id: mongoose.Types.ObjectId;
};
export declare const AutoPostSchedule: Model<AutoPostScheduleDoc>;
export {};
//# sourceMappingURL=AutoPostSchedule.d.ts.map