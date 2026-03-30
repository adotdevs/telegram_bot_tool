import express from "express";
import "express-async-errors";
import cors from "cors";
import { connectMongo } from "./db/mongo.js";
import { env, getAllWebOrigins } from "./config/env.js";
import { refreshCorsFromSettings } from "./services/runtimeSettings.js";
import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/telegramAccounts.js";
import campaignRoutes from "./routes/campaigns.js";
import csvRoutes from "./routes/csv.js";
import logRoutes from "./routes/logs.js";
import dashboardRoutes from "./routes/dashboard.js";
import blacklistRoutes from "./routes/blacklist.js";
import settingsRoutes from "./routes/settings.js";

async function main(): Promise<void> {
  await connectMongo();
  await refreshCorsFromSettings();
  const app = express();
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (getAllWebOrigins().includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/telegram-accounts", accountRoutes);
  app.use("/api/campaigns", campaignRoutes);
  app.use("/api/campaigns", csvRoutes);
  app.use("/api/logs", logRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/blacklist", blacklistRoutes);
  app.use("/api/settings", settingsRoutes);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[api]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: msg });
  });

  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`API http://127.0.0.1:${env.PORT} (bound 0.0.0.0:${env.PORT})`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
