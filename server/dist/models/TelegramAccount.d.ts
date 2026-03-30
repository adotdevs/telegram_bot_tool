import mongoose, { type InferSchemaType, type Model } from "mongoose";
declare const telegramAccountSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "active" | "paused" | "flood_wait" | "peer_flood_risky" | "disabled";
    phoneNumber: string;
    sessionEncrypted: string;
    warmUpMode: boolean;
    rateWindowHour: number;
    addsInWindow: number;
    dmsInWindow: number;
    label?: string | null | undefined;
    proxyUrl?: string | null | undefined;
    floodWaitUntil?: NativeDate | null | undefined;
    peerFloodMarkedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "active" | "paused" | "flood_wait" | "peer_flood_risky" | "disabled";
    phoneNumber: string;
    sessionEncrypted: string;
    warmUpMode: boolean;
    rateWindowHour: number;
    addsInWindow: number;
    dmsInWindow: number;
    label?: string | null | undefined;
    proxyUrl?: string | null | undefined;
    floodWaitUntil?: NativeDate | null | undefined;
    peerFloodMarkedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "active" | "paused" | "flood_wait" | "peer_flood_risky" | "disabled";
    phoneNumber: string;
    sessionEncrypted: string;
    warmUpMode: boolean;
    rateWindowHour: number;
    addsInWindow: number;
    dmsInWindow: number;
    label?: string | null | undefined;
    proxyUrl?: string | null | undefined;
    floodWaitUntil?: NativeDate | null | undefined;
    peerFloodMarkedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type TelegramAccountDoc = InferSchemaType<typeof telegramAccountSchema> & {
    _id: mongoose.Types.ObjectId;
};
export declare const TelegramAccount: Model<TelegramAccountDoc>;
export {};
//# sourceMappingURL=TelegramAccount.d.ts.map