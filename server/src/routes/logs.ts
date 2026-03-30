import { Router } from "express";
import mongoose from "mongoose";
import { ActionLog } from "../models/ActionLog.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const r = Router();

r.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10) || 100, 500);
  const q: Record<string, unknown> = {};
  const cid = String(req.query.campaignId ?? "");
  if (cid && mongoose.Types.ObjectId.isValid(cid)) {
    q.campaignId = new mongoose.Types.ObjectId(cid);
  }
  const logs = await ActionLog.find(q)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json(logs);
});

export default r;
