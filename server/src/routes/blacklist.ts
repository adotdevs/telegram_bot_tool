import { Router } from "express";
import { z } from "zod";
import { BlacklistEntry } from "../models/BlacklistEntry.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const r = Router();

r.get("/", requireAuth, async (_req: AuthedRequest, res) => {
  const list = await BlacklistEntry.find().sort({ updatedAt: -1 }).limit(500).lean();
  res.json(list);
});

r.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const body = z.object({ telegramId: z.string().min(1), reason: z.string().optional() }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const doc = await BlacklistEntry.findOneAndUpdate(
    { telegramId: body.data.telegramId },
    { reason: body.data.reason },
    { upsert: true, new: true }
  );
  res.json(doc);
});

r.delete("/:telegramId", requireAuth, async (req, res) => {
  await BlacklistEntry.deleteOne({ telegramId: req.params.telegramId });
  res.json({ ok: true });
});

export default r;
