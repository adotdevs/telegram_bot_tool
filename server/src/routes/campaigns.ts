import { Router } from "express";
import { z } from "zod";
import { Campaign } from "../models/Campaign.js";
import { CampaignUser } from "../models/CampaignUser.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { enqueueScrape, enqueueCampaignTick } from "../queues/setup.js";

const r = Router();

const createCampaign = z.object({
  name: z.string().min(1),
  sourceGroupUsername: z.string().optional(),
  targetGroupUsername: z.string().optional(),
  targetGroupLink: z.string().optional(),
  messageTemplate: z.string().min(1),
  batchSize: z.number().min(1).max(500).optional(),
  useAiVariations: z.boolean().optional(),
  onlyActiveUsers: z.boolean().optional(),
});

r.get("/", requireAuth, async (_req: AuthedRequest, res) => {
  const list = await Campaign.find().sort({ updatedAt: -1 }).lean();
  res.json(list);
});

r.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const body = createCampaign.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const c = await Campaign.create({ ...body.data, status: "draft" });
  res.json(c);
});

r.patch("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const body = z
    .object({
      name: z.string().optional(),
      sourceGroupUsername: z.string().nullable().optional(),
      targetGroupUsername: z.string().nullable().optional(),
      targetGroupLink: z.string().nullable().optional(),
      messageTemplate: z.string().optional(),
      batchSize: z.number().optional(),
      useAiVariations: z.boolean().optional(),
      onlyActiveUsers: z.boolean().optional(),
      status: z.enum(["draft", "running", "paused", "completed"]).optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const c = await Campaign.findById(id);
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (body.data.status === "running" && c.status !== "running") {
    Object.assign(c, body.data);
    c.status = "running";
    await c.save();
    if (c.sourceGroupUsername) {
      await enqueueScrape(c._id.toString());
    } else {
      await enqueueCampaignTick(c._id.toString(), 4000);
    }
    res.json(c);
    return;
  }

  if (body.data.status === "paused") {
    c.status = "paused";
    await c.save();
    res.json(c);
    return;
  }

  Object.assign(c, body.data);
  await c.save();
  res.json(c);
});

r.get("/:id/users", requireAuth, async (req, res) => {
  const users = await CampaignUser.find({ campaignId: req.params.id })
    .limit(200)
    .sort({ updatedAt: -1 })
    .lean();
  res.json(users);
});

export default r;
