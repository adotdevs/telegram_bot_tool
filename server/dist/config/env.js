import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { z } from "zod";
/** This file lives in `server/src/config` — resolve monorepo root and load `.env` there when npm runs `-w server` from `server/`. */
const envDir = path.dirname(fileURLToPath(import.meta.url));
const serverPackageRoot = path.resolve(envDir, "../..");
const repoRoot = path.resolve(envDir, "../../..");
const envCandidates = [
    path.join(repoRoot, ".env"),
    path.join(serverPackageRoot, ".env"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
];
let envPath;
for (const p of envCandidates) {
    if (existsSync(p)) {
        config({ path: p });
        envPath = p;
        break;
    }
}
if (!envPath) {
    config();
}
const schema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(4000),
    MONGODB_URI: z.string().min(1),
    REDIS_URL: z.string().min(1).default("redis://127.0.0.1:6379"),
    JWT_SECRET: z.string().min(16).default("change-me-in-production-32chars"),
    SESSION_ENCRYPTION_KEY: z.string().min(32, "Use 32+ chars for AES-256 key material"),
    /** Optional if set via dashboard App Settings */
    TELEGRAM_API_ID: z.coerce.number().optional().default(0),
    TELEGRAM_API_HASH: z.string().optional().default(""),
    WEB_ORIGIN: z.string().default("http://localhost:3000"),
    /** Optional OpenAI for AI message variations */
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    BATCH_SIZE_MIN: z.coerce.number().default(50),
    BATCH_SIZE_MAX: z.coerce.number().default(100),
    MAX_ADDS_PER_HOUR: z.coerce.number().min(1).max(30).default(25),
    MAX_DMS_PER_HOUR: z.coerce.number().min(1).max(20).default(12),
    DM_PROBABILITY: z.coerce.number().min(0).max(1).default(0.6),
    ACTIONS_BEFORE_LONG_PAUSE_MIN: z.coerce.number().default(5),
    ACTIONS_BEFORE_LONG_PAUSE_MAX: z.coerce.number().default(12),
    /** How many users are claimed & queued per orchestration tick (keep low for anti-ban) */
    CAMPAIGN_MAX_PARALLEL: z.coerce.number().min(1).max(25).default(2),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
}
export const env = parsed.data;
if (env.NODE_ENV !== "production" && envPath) {
    console.info(`[config] Using env file: ${envPath}`);
}
/** Comma-separated in WEB_ORIGIN; always includes localhost + 127.0.0.1 for dev */
export const webOrigins = [
    ...new Set([
        ...env.WEB_ORIGIN.split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ].filter(Boolean)),
];
let extraWebOriginsFromDashboard = [];
/** Merged with dashboard "extra Web origins" after settings load */
export function setExtraWebOrigins(origins) {
    extraWebOriginsFromDashboard = origins;
}
export function getAllWebOrigins() {
    return [...new Set([...webOrigins, ...extraWebOriginsFromDashboard])];
}
//# sourceMappingURL=env.js.map