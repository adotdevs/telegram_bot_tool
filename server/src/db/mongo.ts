import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectMongo(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30_000,
    socketTimeoutMS: 120_000,
    connectTimeoutMS: 30_000,
    maxPoolSize: 10,
    /** Atlas SRV on Windows often misbehaves with IPv6; force IPv4 */
    family: 4,
  });
}
