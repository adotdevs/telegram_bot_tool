import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { Campaign } from "../models/Campaign.js";
import { CampaignUser } from "../models/CampaignUser.js";
import { BlacklistEntry } from "../models/BlacklistEntry.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const r = Router({ mergeParams: true });

function rowKeys(row: Record<string, string>): Record<string, string> {
  return Object.keys(row).reduce<Record<string, string>>((acc, k) => {
    acc[k.trim().toLowerCase().replace(/\s+/g, "_")] = String(row[k] ?? "").trim();
    return acc;
  }, {});
}

r.post("/:id/csv", requireAuth, upload.single("file"), async (req: AuthedRequest, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (!req.file?.buffer) {
    res.status(400).json({ error: "file required (multipart field: file)" });
    return;
  }

  let records: Record<string, string>[];
  try {
    records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : "CSV parse error" });
    return;
  }

  let inserted = 0;
  for (const raw of records) {
    const k = rowKeys(raw);
    const rawId = k["user_id"] || k["telegram_id"] || k["id"] || "";
    const username = (k["username"] || k["handle"] || "").replace(/^@/, "");
    const numericId = /^\d+$/.test(rawId) ? rawId : null;

    let telegramId: string;
    if (numericId) {
      telegramId = numericId;
    } else if (username) {
      telegramId = `UN:${username.toLowerCase()}`;
    } else continue;

    if (numericId) {
      const bl = await BlacklistEntry.findOne({ telegramId: numericId });
      if (bl) continue;
    }

    try {
      const r0 = await CampaignUser.updateOne(
        { campaignId: campaign._id, telegramId },
        {
          $setOnInsert: {
            campaignId: campaign._id,
            telegramId,
            username: username || undefined,
            status: "pending",
            isBot: false,
          },
        },
        { upsert: true }
      );
      if (r0.upsertedCount) inserted += 1;
    } catch {
      /* duplicate */
    }
  }

  const scraped = await CampaignUser.countDocuments({ campaignId: campaign._id });
  campaign.set("stats.scraped", scraped);
  await campaign.save();

  res.json({ merged: inserted, totalUsers: scraped });
});

export default r;
