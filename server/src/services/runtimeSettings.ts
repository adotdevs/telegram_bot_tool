import { AppSettings } from "../models/AppSettings.js";
import { env, setExtraWebOrigins } from "../config/env.js";

export type RuntimeSettings = {
  telegramApiId: number;
  telegramApiHash: string;
  openaiApiKey?: string;
  openaiModel: string;
  maxAddsPerHour: number;
  maxDmsPerHour: number;
  dmProbability: number;
  batchSizeMax: number;
  campaignMaxParallel: number;
  actionsBeforeLongPauseMin: number;
  actionsBeforeLongPauseMax: number;
};

let cache: { at: number; value: RuntimeSettings } | null = null;
const TTL_MS = 4000;

type SettingsDocLike = {
  telegramApiId?: number | null;
  telegramApiHash?: string | null;
  openaiApiKey?: string | null;
  openaiModel?: string | null;
  maxAddsPerHour?: number | null;
  maxDmsPerHour?: number | null;
  dmProbability?: number | null;
  batchSizeMax?: number | null;
  campaignMaxParallel?: number | null;
  actionsBeforeLongPauseMin?: number | null;
  actionsBeforeLongPauseMax?: number | null;
} | null;

function merge(doc: SettingsDocLike): RuntimeSettings {
  return {
    telegramApiId: doc?.telegramApiId ?? env.TELEGRAM_API_ID,
    telegramApiHash: doc?.telegramApiHash?.trim() || env.TELEGRAM_API_HASH,
    openaiApiKey: doc?.openaiApiKey?.trim() || env.OPENAI_API_KEY,
    openaiModel: doc?.openaiModel?.trim() || env.OPENAI_MODEL,
    maxAddsPerHour: doc?.maxAddsPerHour ?? env.MAX_ADDS_PER_HOUR,
    maxDmsPerHour: doc?.maxDmsPerHour ?? env.MAX_DMS_PER_HOUR,
    dmProbability: doc?.dmProbability ?? env.DM_PROBABILITY,
    batchSizeMax: doc?.batchSizeMax ?? env.BATCH_SIZE_MAX,
    campaignMaxParallel: doc?.campaignMaxParallel ?? env.CAMPAIGN_MAX_PARALLEL,
    actionsBeforeLongPauseMin: doc?.actionsBeforeLongPauseMin ?? env.ACTIONS_BEFORE_LONG_PAUSE_MIN,
    actionsBeforeLongPauseMax: doc?.actionsBeforeLongPauseMax ?? env.ACTIONS_BEFORE_LONG_PAUSE_MAX,
  };
}

export async function getRuntimeSettings(): Promise<RuntimeSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const doc = await AppSettings.findById("app");
  const value = merge(doc);
  cache = { at: Date.now(), value };
  return value;
}

export function invalidateRuntimeSettingsCache(): void {
  cache = null;
}

export async function refreshCorsFromSettings(): Promise<void> {
  const doc = await AppSettings.findById("app").lean();
  const extra = doc?.extraWebOrigins
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  setExtraWebOrigins(extra ?? []);
}

export function assertTelegramConfigured(s: RuntimeSettings): void {
  if (!s.telegramApiId || !s.telegramApiHash) {
    throw new Error(
      "Telegram API is not configured. Open Settings in the dashboard (or set TELEGRAM_API_ID / TELEGRAM_API_HASH in .env)."
    );
  }
}

export async function getSettingsResponse() {
  const doc = await AppSettings.findById("app").lean();
  const eff = merge(doc);
  return {
    effective: {
      telegramApiId: eff.telegramApiId,
      telegramApiHashConfigured: Boolean(eff.telegramApiHash),
      openaiConfigured: Boolean(eff.openaiApiKey),
      openaiModel: eff.openaiModel,
      maxAddsPerHour: eff.maxAddsPerHour,
      maxDmsPerHour: eff.maxDmsPerHour,
      dmProbability: eff.dmProbability,
      batchSizeMax: eff.batchSizeMax,
      campaignMaxParallel: eff.campaignMaxParallel,
      actionsBeforeLongPauseMin: eff.actionsBeforeLongPauseMin,
      actionsBeforeLongPauseMax: eff.actionsBeforeLongPauseMax,
      extraWebOrigins: doc?.extraWebOrigins ?? "",
    },
    fromEnvFallback: {
      telegramApiId: Boolean(env.TELEGRAM_API_ID),
      telegramApiHash: Boolean(env.TELEGRAM_API_HASH?.trim()),
    },
    savedInDashboard: doc
      ? {
          telegramApiId: doc.telegramApiId != null,
          telegramApiHash: Boolean(doc.telegramApiHash?.trim()),
          openaiApiKey: Boolean(doc.openaiApiKey?.trim()),
          openaiModel: Boolean(doc.openaiModel?.trim()),
          maxAddsPerHour: doc.maxAddsPerHour != null,
          maxDmsPerHour: doc.maxDmsPerHour != null,
          dmProbability: doc.dmProbability != null,
          batchSizeMax: doc.batchSizeMax != null,
          campaignMaxParallel: doc.campaignMaxParallel != null,
          actionsBeforeLongPauseMin: doc.actionsBeforeLongPauseMin != null,
          actionsBeforeLongPauseMax: doc.actionsBeforeLongPauseMax != null,
        }
      : null,
  };
}
