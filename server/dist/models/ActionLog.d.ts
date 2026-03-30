import mongoose, { type InferSchemaType, type Model } from "mongoose";
declare const actionLogSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    message: string;
    action: "scrape" | "add_user" | "send_message" | "orchestrate" | "login" | "other";
    level: "error" | "info" | "warn";
    success: boolean;
    campaignId?: mongoose.Types.ObjectId | null | undefined;
    campaignUserId?: mongoose.Types.ObjectId | null | undefined;
    telegramAccountId?: mongoose.Types.ObjectId | null | undefined;
    meta?: any;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    message: string;
    action: "scrape" | "add_user" | "send_message" | "orchestrate" | "login" | "other";
    level: "error" | "info" | "warn";
    success: boolean;
    campaignId?: mongoose.Types.ObjectId | null | undefined;
    campaignUserId?: mongoose.Types.ObjectId | null | undefined;
    telegramAccountId?: mongoose.Types.ObjectId | null | undefined;
    meta?: any;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    message: string;
    action: "scrape" | "add_user" | "send_message" | "orchestrate" | "login" | "other";
    level: "error" | "info" | "warn";
    success: boolean;
    campaignId?: mongoose.Types.ObjectId | null | undefined;
    campaignUserId?: mongoose.Types.ObjectId | null | undefined;
    telegramAccountId?: mongoose.Types.ObjectId | null | undefined;
    meta?: any;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type ActionLogDoc = InferSchemaType<typeof actionLogSchema> & {
    _id: mongoose.Types.ObjectId;
};
export declare const ActionLog: Model<ActionLogDoc>;
export {};
//# sourceMappingURL=ActionLog.d.ts.map