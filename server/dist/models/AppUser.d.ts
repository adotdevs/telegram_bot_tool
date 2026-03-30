import mongoose, { type InferSchemaType, type Model } from "mongoose";
declare const appUserSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    email: string;
    passwordHash: string;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    email: string;
    passwordHash: string;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    email: string;
    passwordHash: string;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type AppUserDoc = InferSchemaType<typeof appUserSchema> & {
    _id: mongoose.Types.ObjectId;
};
export declare const AppUser: Model<AppUserDoc>;
export {};
//# sourceMappingURL=AppUser.d.ts.map