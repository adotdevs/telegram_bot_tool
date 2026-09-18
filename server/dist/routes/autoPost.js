import { Router } from "express";
import { z } from "zod";
import { AutoPostSchedule } from "../models/AutoPostSchedule.js";
import { requireAuth } from "../middleware/auth.js";
import { enqueueAutoPost } from "../queues/setup.js";
import { getRuntimeSettings } from "../services/runtimeSettings.js";
import { parseSpintax } from "../services/groupActions.js";
import { synonymizeTemplate, varyStructure } from "../services/messageVariator.js";
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
const generateAiSchema = z.object({
    prompt: z.string().optional(),
    template: z.string().optional(),
    taskName: z.string().optional(),
    mode: z.enum(["generate", "test"]).optional().default("generate"),
});
// Generate or test AI response for Auto-Post messages
r.post("/generate-ai", requireAuth, async (req, res) => {
    const parsed = generateAiSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { prompt, template, taskName, mode } = parsed.data;
    const cfg = await getRuntimeSettings();
    if (!cfg.openaiApiKey) {
        res.status(400).json({
            error: "OpenAI API key is not configured. Please add your OPENAI_API_KEY in Settings or in your .env file to enable AI generation.",
        });
        return;
    }
    let systemPrompt = "";
    let userPrompt = "";
    if (mode === "test") {
        const rawTemplate = template?.trim() || "Hello everyone! Check out our project: https://t.me/example";
        const evaluated = varyStructure(synonymizeTemplate(parseSpintax(rawTemplate)));
        systemPrompt =
            "You are a Telegram assistant rewriting promotional posts. Rewrite ONE short message in a natural, casual, and friendly human tone. Keep the same core intent, links, and mentions intact. Do NOT add quotes or markdown code blocks. Max 2-3 sentences.";
        userPrompt = evaluated;
    }
    else {
        const topic = prompt?.trim() ||
            (taskName?.trim() ? `Promote "${taskName.trim()}"` : "General community promotional announcement");
        systemPrompt =
            "You are an expert Telegram growth marketer. Write an engaging, authentic Telegram group promotional message with Spintax syntax (e.g., {Hey|Hello|Hi} everyone, {check out|explore}...). Keep it under 3-4 sentences. Include a link placeholder like https://t.me/example. Output ONLY the message text without wrapping quotes or markdown code blocks.";
        userPrompt = `Topic or objective: ${topic}`;
    }
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${cfg.openaiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: cfg.openaiModel || "gpt-4o-mini",
                temperature: 0.85,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
            }),
        });
        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const errDetail = errJson?.error?.message ||
                `OpenAI error (${response.status}: ${response.statusText})`;
            res.status(400).json({ error: errDetail });
            return;
        }
        const data = (await response.json());
        const generated = data.choices?.[0]?.message?.content?.trim() || "";
        res.json({
            message: generated,
            model: cfg.openaiModel || "gpt-4o-mini",
            mode,
            tokensUsed: data.usage?.total_tokens,
        });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to communicate with OpenAI";
        res.status(500).json({ error: msg });
    }
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
        try {
            await enqueueAutoPost(doc._id.toString(), 3000);
        } catch (e) {
            console.error("[auto-post] Failed to enqueue job on resume:", e?.message || e);
        }
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
    try {
        await enqueueAutoPost(doc._id.toString(), 0);
        res.json({ ok: true, message: "Auto-post job enqueued immediately" });
    } catch (e) {
        console.error("[auto-post] Run-now failed to enqueue to Redis:", e?.message || e);
        res.status(500).json({
            error: `Redis Connection Error: ${e?.message || "Could not connect to Redis"}. Make sure your live REDIS_URL environment variable is set to an active Upstash/Redis connection string.`,
        });
    }
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