import mongoose, { Schema } from "mongoose";
const appUserSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
}, { timestamps: true });
export const AppUser = mongoose.models.AppUser ?? mongoose.model("AppUser", appUserSchema);
//# sourceMappingURL=AppUser.js.map