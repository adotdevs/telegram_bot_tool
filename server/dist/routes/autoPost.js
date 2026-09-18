import { Router } from "express";
import { z } from "zod";
import { AutoPostSchedule } from "../models/AutoPostSchedule.js";
import { requireAuth } from "../middleware/auth.js";
import { enqueueAutoPost } from "../queues/setup.js";
const r = Router();
const createScheduleSchema = z.object({
    name: z.string().min(1, "Name is required"),
    targetGroups: z.array(z.string()).min(1, "At least one target group is required"),
    messageTemplate: z.string().min(1, "Message template is required"),
    intervalMinutes: z.coerce.number().min(1).default(60),
    accountIds: z.array(z.string()).optional(),
    useAiVariations: z.boolean().optional().default(false),
    autoJoinGroups: z.boolean().optional().default(true),
    delayBetweenGroupsSeconds: z.coerce.number().min(2).max(120).optional().default(12),
    status: z.enum(["active", "paused", "draft"]).optional().default("active"),
});
const patchScheduleSchema = z.object({
    name: z.string().min(1).optional(),
    targetGroups: z.array(z.string()).optional(),
    messageTemplate: z.string().min(1).optional(),
    intervalMinutes: z.coerce.number().min(1).optional(),
    accountIds: z.array(z.string()).optional(),
    useAiVariations: z.boolean().optional(),
    autoJoinGroups: z.boolean().optional(),
    delayBetweenGroupsSeconds: z.coerce.number().min(2).max(120).optional(),
    status: z.enum(["active", "paused", "draft"]).optional(),
});
// List all schedules
r.get("/", requireAuth, async (_req, res) => {
    const list = await AutoPostSchedule.find().sort({ updatedAt: -1 }).lean();
    res.json(list);
});
// Create new schedule
r.post("/", requireAuth, async (req, res) => {
    const parsed = createScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const doc = await AutoPostSchedule.create({
        ...parsed.data,
        targetGroups: parsed.data.targetGroups.map((g) => g.trim()).filter(Boolean),
        nextRunAt: new Date(Date.now() + 5000), // First run in 5s if active
    });
    if (doc.status === "active") {
        await enqueueAutoPost(doc._id.toString(), 5000);
    }
    res.status(201).json(doc);
});
// Get single schedule
r.get("/:id", requireAuth, async (req, res) => {
    const doc = await AutoPostSchedule.findById(req.params.id).lean();
    if (!doc) {
        res.status(404).json({ error: "Schedule not found" });
        return;
    }
    res.json(doc);
});
// Update schedule
r.patch("/:id", requireAuth, async (req, res) => {
    const parsed = patchScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const doc = await AutoPostSchedule.findById(req.params.id);
    if (!doc) {
        res.status(404).json({ error: "Schedule not found" });
        return;
    }
    const prevStatus = doc.status;
    if (parsed.data.targetGroups) {
        parsed.data.targetGroups = parsed.data.targetGroups.map((g) => g.trim()).filter(Boolean);
    }
    Object.assign(doc, parsed.data);
    // If newly activated, schedule run
    if (parsed.data.status === "active" && prevStatus !== "active") {
        doc.nextRunAt = new Date(Date.now() + 3000);
        await enqueueAutoPost(doc._id.toString(), 3000);
    }
    await doc.save();
    res.json(doc);
});
// Toggle active/paused
r.post("/:id/toggle", requireAuth, async (req, res) => {
    const doc = await AutoPostSchedule.findById(req.params.id);
    if (!doc) {
        res.status(404).json({ error: "Schedule not found" });
        return;
    }
    if (doc.status === "active") {
        doc.status = "paused";
        doc.lastLog = "Schedule paused by user";
    }
    else {
        doc.status = "active";
        doc.nextRunAt = new Date(Date.now() + 3000);
        doc.lastLog = "Schedule resumed";
        await enqueueAutoPost(doc._id.toString(), 3000);
    }
    await doc.save();
    res.json(doc);
});
// Run Now (trigger immediately)
r.post("/:id/run-now", requireAuth, async (req, res) => {
    const doc = await AutoPostSchedule.findById(req.params.id);
    if (!doc) {
        res.status(404).json({ error: "Schedule not found" });
        return;
    }
    doc.lastLog = "Manual trigger requested...";
    await doc.save();
    await enqueueAutoPost(doc._id.toString(), 0);
    res.json({ ok: true, message: "Auto-post job enqueued immediately" });
});
// Delete schedule
r.delete("/:id", requireAuth, async (req, res) => {
    const doc = await AutoPostSchedule.findByIdAndDelete(req.params.id);
    if (!doc) {
        res.status(404).json({ error: "Schedule not found" });
        return;
    }
    res.json({ ok: true });
});
export default r;
//# sourceMappingURL=autoPost.js.map