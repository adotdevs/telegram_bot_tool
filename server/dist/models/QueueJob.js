import mongoose, { Schema } from "mongoose";
const queueJobSchema = new Schema({
    queueName: { type: String, required: true, index: true },
    name: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
        index: true,
    },
    runAt: { type: Date, required: true, default: Date.now, index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 7 },
    failedReason: { type: String },
    lockedAt: { type: Date, index: true },
    lockedBy: { type: String },
}, { timestamps: true });
// High-performance index for claiming due jobs atomically
queueJobSchema.index({ queueName: 1, status: 1, runAt: 1 });
queueJobSchema.index({ status: 1, lockedAt: 1 });
export const QueueJob = mongoose.models.QueueJob ?? mongoose.model("QueueJob", queueJobSchema);
//# sourceMappingURL=QueueJob.js.map