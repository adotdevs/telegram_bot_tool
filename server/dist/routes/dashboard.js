import { Router } from "express";
import { Campaign } from "../models/Campaign.js";
import { CampaignUser } from "../models/CampaignUser.js";
import { TelegramAccount } from "../models/TelegramAccount.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/summary", requireAuth, async (_req, res) => {
    const [campaigns, users, accounts] = await Promise.all([
        Campaign.aggregate([
            {
                $group: {
                    _id: null,
                    totalScraped: { $sum: { $ifNull: ["$stats.scraped", 0] } },
                    totalAdded: { $sum: { $ifNull: ["$stats.added", 0] } },
                    totalMessaged: { $sum: { $ifNull: ["$stats.messaged", 0] } },
                    totalFailed: { $sum: { $ifNull: ["$stats.failed", 0] } },
                },
            },
        ]),
        CampaignUser.countDocuments({ status: "failed" }),
        TelegramAccount.countDocuments({ status: "active" }),
    ]);
    const c = campaigns[0] ?? {
        totalScraped: 0,
        totalAdded: 0,
        totalMessaged: 0,
        totalFailed: 0,
    };
    res.json({
        totalUsersScraped: c.totalScraped ?? 0,
        totalAdded: c.totalAdded ?? 0,
        totalMessaged: c.totalMessaged ?? 0,
        totalFailed: (c.totalFailed ?? 0) + users,
        activeAccounts: accounts,
    });
});
export default r;
//# sourceMappingURL=dashboard.js.map