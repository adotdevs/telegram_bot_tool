import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const appUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export type AppUserDoc = InferSchemaType<typeof appUserSchema> & { _id: mongoose.Types.ObjectId };

export const AppUser: Model<AppUserDoc> =
  mongoose.models.AppUser ?? mongoose.model<AppUserDoc>("AppUser", appUserSchema);
