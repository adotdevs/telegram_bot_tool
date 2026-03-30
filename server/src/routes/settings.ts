import { Router } from "express";
import { z } from "zod";
import { AppSettings } from "../models/AppSettings.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import {
  getSettingsResponse,
  invalidateRuntimeSettingsCache,
  refreshCorsFromSettings,
} from "../services/runtimeSettings.js";

const r = Router();

const patchSchema = z.object({
  telegramApiId: z.coerce.number().int().positive().optional(),
  telegramApiHash: z.string().min(1).optional(),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().optional(),
  maxAddsPerHour: z.coerce.number().min(1).max(30).optional(),
  maxDmsPerHour: z.coerce.number().min(1).max(25).optional(),
  dmProbability: z.coerce.number().min(0).max(1).optional(),
  batchSizeMax: z.coerce.number().min(1).max(500).optional(),
  campaignMaxParallel: z.coerce.number().min(1).max(25).optional(),
  actionsBeforeLongPauseMin: z.coerce.number().min(1).max(50).optional(),
  actionsBeforeLongPauseMax: z.coerce.number().min(1).max(50).optional(),
  extraWebOrigins: z.string().optional(),
});

r.get("/", requireAuth, async (_req: AuthedRequest, res) => {
  res.json(await getSettingsResponse());
});

r.patch("/", requireAuth, async (req: AuthedRequest, res) => {
  const body = patchSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const d = body.data;
  const $set: Record<string, unknown> = {};
  if (d.telegramApiId !== undefined) $set.telegramApiId = d.telegramApiId;
  if (d.telegramApiHash !== undefined) $set.telegramApiHash = d.telegramApiHash;
  if (d.openaiApiKey !== undefined) $set.openaiApiKey = d.openaiApiKey || undefined;
  if (d.openaiModel !== undefined) $set.openaiModel = d.openaiModel || undefined;
  if (d.maxAddsPerHour !== undefined) $set.maxAddsPerHour = d.maxAddsPerHour;
  if (d.maxDmsPerHour !== undefined) $set.maxDmsPerHour = d.maxDmsPerHour;
  if (d.dmProbability !== undefined) $set.dmProbability = d.dmProbability;
  if (d.batchSizeMax !== undefined) $set.batchSizeMax = d.batchSizeMax;
  if (d.campaignMaxParallel !== undefined) $set.campaignMaxParallel = d.campaignMaxParallel;
  if (d.actionsBeforeLongPauseMin !== undefined) $set.actionsBeforeLongPauseMin = d.actionsBeforeLongPauseMin;
  if (d.actionsBeforeLongPauseMax !== undefined) $set.actionsBeforeLongPauseMax = d.actionsBeforeLongPauseMax;
  if (d.extraWebOrigins !== undefined) $set.extraWebOrigins = d.extraWebOrigins;

  if (Object.keys($set).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  await AppSettings.findOneAndUpdate({ _id: "app" }, { $set }, { upsert: true, new: true });
  invalidateRuntimeSettingsCache();
  await refreshCorsFromSettings();
  res.json(await getSettingsResponse());
});

export default r;
