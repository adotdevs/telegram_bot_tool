import mongoose, { type InferSchemaType, type Model } from "mongoose";
declare const queueJobSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "completed" | "failed" | "pending" | "processing";
    name: string;
    data: any;
    queueName: string;
    runAt: NativeDate;
    attempts: number;
    maxAttempts: number;
    failedReason?: string | null | undefined;
    lockedAt?: NativeDate | null | undefined;
    lockedBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "completed" | "failed" | "pending" | "processing";
    name: string;
    data: any;
    queueName: string;
    runAt: NativeDate;
    attempts: number;
    maxAttempts: number;
    failedReason?: string | null | undefined;
    lockedAt?: NativeDate | null | undefined;
    lockedBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "completed" | "failed" | "pending" | "processing";
    name: string;
    data: any;
    queueName: string;
    runAt: NativeDate;
    attempts: number;
    maxAttempts: number;
    failedReason?: string | null | undefined;
    lockedAt?: NativeDate | null | undefined;
    lockedBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type QueueJobDoc = InferSchemaType<typeof queueJobSchema> & {
    _id: mongoose.Types.ObjectId;
};
export declare const QueueJob: Model<QueueJobDoc>;
export {};
//# sourceMappingURL=QueueJob.d.ts.map