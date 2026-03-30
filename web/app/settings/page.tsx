"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type SettingsPayload = {
  effective: {
    telegramApiId: number;
    telegramApiHashConfigured: boolean;
    openaiConfigured: boolean;
    openaiModel: string;
    maxAddsPerHour: number;
    maxDmsPerHour: number;
    dmProbability: number;
    batchSizeMax: number;
    campaignMaxParallel: number;
    actionsBeforeLongPauseMin: number;
    actionsBeforeLongPauseMax: number;
    extraWebOrigins: string;
  };
  fromEnvFallback: { telegramApiId: boolean; telegramApiHash: boolean };
};

export default function SettingsPage() {
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [telegramApiId, setTelegramApiId] = useState("");
  const [telegramApiHash, setTelegramApiHash] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-4o-mini");
  const [maxAddsPerHour, setMaxAddsPerHour] = useState("25");
  const [maxDmsPerHour, setMaxDmsPerHour] = useState("12");
  const [dmProbability, setDmProbability] = useState("0.6");
  const [batchSizeMax, setBatchSizeMax] = useState("100");
  const [campaignMaxParallel, setCampaignMaxParallel] = useState("2");
  const [actionsBeforeLongPauseMin, setActionsMin] = useState("5");
  const [actionsBeforeLongPauseMax, setActionsMax] = useState("12");
  const [extraWebOrigins, setExtraWebOrigins] = useState("");

  async function load() {
    const p = await api<SettingsPayload>("/api/settings");
    setData(p);
    const e = p.effective;
    setTelegramApiId(String(e.telegramApiId || ""));
    setOpenaiModel(e.openaiModel);
    setMaxAddsPerHour(String(e.maxAddsPerHour));
    setMaxDmsPerHour(String(e.maxDmsPerHour));
    setDmProbability(String(e.dmProbability));
    setBatchSizeMax(String(e.batchSizeMax));
    setCampaignMaxParallel(String(e.campaignMaxParallel));
    setActionsMin(String(e.actionsBeforeLongPauseMin));
    setActionsMax(String(e.actionsBeforeLongPauseMax));
    setExtraWebOrigins(e.extraWebOrigins || "");
    setTelegramApiHash("");
    setOpenaiApiKey("");
  }

  useEffect(() => {
    load().catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    try {
      const body: Record<string, unknown> = {
        telegramApiId: parseInt(telegramApiId, 10),
        openaiModel: openaiModel.trim() || undefined,
        maxAddsPerHour: parseInt(maxAddsPerHour, 10),
        maxDmsPerHour: parseInt(maxDmsPerHour, 10),
        dmProbability: parseFloat(dmProbability),
        batchSizeMax: parseInt(batchSizeMax, 10),
        campaignMaxParallel: parseInt(campaignMaxParallel, 10),
        actionsBeforeLongPauseMin: parseInt(actionsBeforeLongPauseMin, 10),
        actionsBeforeLongPauseMax: parseInt(actionsBeforeLongPauseMax, 10),
        extraWebOrigins: extraWebOrigins.trim() || undefined,
      };
      if (telegramApiHash.trim()) body.telegramApiHash = telegramApiHash.trim();
      if (openaiApiKey.trim()) body.openaiApiKey = openaiApiKey.trim();

      await api("/api/settings", { method: "PATCH", json: body });
      setSaved(true);
      await load();
    } catch (x: unknown) {
      setErr(x instanceof Error ? x.message : "Error");
    }
  }

  if (!data) return <p className="text-zinc-500">{err ?? "Loading…"}</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Saved in the database. Still keep <strong>secrets for the server itself</strong> only in{" "}
          <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">.env</code> (see below).
        </p>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Telegram API (for GramJS)</h2>
        <p className="text-xs text-zinc-500">
          Get from{" "}
          <a className="text-blue-600 underline" href="https://my.telegram.org" target="_blank" rel="noreferrer">
            my.telegram.org
          </a>{" "}
          → API development tools → <strong>api_id</strong> (number) and <strong>api_hash</strong> (string).
          {data.fromEnvFallback.telegramApiId &&
            data.fromEnvFallback.telegramApiHash &&
            " You also have values in .env; dashboard values save on top when set."}
        </p>
        <input
          type="number"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          placeholder="API ID"
          value={telegramApiId}
          onChange={(e) => setTelegramApiId(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          placeholder={data.effective.telegramApiHashConfigured ? "API hash (enter only to change)" : "API hash"}
          value={telegramApiHash}
          onChange={(e) => setTelegramApiHash(e.target.value)}
          autoComplete="off"
        />

        <h2 className="pt-4 text-sm font-medium text-zinc-800 dark:text-zinc-200">OpenAI (optional)</h2>
        <p className="text-xs text-zinc-500">
          Key from{" "}
          <a className="text-blue-600 underline" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
            platform.openai.com/api-keys
          </a>
          . Leave blank if unused.
        </p>
        <input
          type="password"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          placeholder={data.effective.openaiConfigured ? "API key (enter only to change)" : "OpenAI API key"}
          value={openaiApiKey}
          onChange={(e) => setOpenaiApiKey(e.target.value)}
        />
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          value={openaiModel}
          onChange={(e) => setOpenaiModel(e.target.value)}
        />

        <h2 className="pt-4 text-sm font-medium text-zinc-800 dark:text-zinc-200">Rate limits & workers</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            Max adds / hour / account
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-600"
              value={maxAddsPerHour}
              onChange={(e) => setMaxAddsPerHour(e.target.value)}
            />
          </label>
          <label className="text-xs">
            Max DMs / hour / account
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-600"
              value={maxDmsPerHour}
              onChange={(e) => setMaxDmsPerHour(e.target.value)}
            />
          </label>
          <label className="text-xs">
            DM probability (0–1)
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-600"
              value={dmProbability}
              onChange={(e) => setDmProbability(e.target.value)}
            />
          </label>
          <label className="text-xs">
            Batch size max
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-600"
              value={batchSizeMax}
              onChange={(e) => setBatchSizeMax(e.target.value)}
            />
          </label>
          <label className="text-xs">
            Campaign max parallel
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-600"
              value={campaignMaxParallel}
              onChange={(e) => setCampaignMaxParallel(e.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            Long pause after N actions (min)
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-600"
              value={actionsBeforeLongPauseMin}
              onChange={(e) => setActionsMin(e.target.value)}
            />
          </label>
          <label className="text-xs">
            Long pause after N actions (max)
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-600"
              value={actionsBeforeLongPauseMax}
              onChange={(e) => setActionsMax(e.target.value)}
            />
          </label>
        </div>

        <h2 className="pt-4 text-sm font-medium text-zinc-800 dark:text-zinc-200">Extra CORS origins</h2>
        <p className="text-xs text-zinc-500">
          Comma-separated URLs if you open the app from another host (in addition to <code>WEB_ORIGIN</code> in .env).
        </p>
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          placeholder="https://your-ip:3000, https://app.example.com"
          value={extraWebOrigins}
          onChange={(e) => setExtraWebOrigins(e.target.value)}
        />

        {err && <p className="text-sm text-red-500">{err}</p>}
        {saved && <p className="text-sm text-emerald-600">Saved.</p>}
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Save settings
        </button>
      </form>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">
        <h3 className="font-medium text-amber-900 dark:text-amber-200">Keep these in .env only (not the dashboard)</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900/90 dark:text-amber-100/90">
          <li>
            <strong>MONGODB_URI</strong> —{" "}
            <a className="underline" href="https://www.mongodb.com/atlas" target="_blank" rel="noreferrer">
              MongoDB Atlas
            </a>{" "}
            → Connect → connection string (username + password + cluster URL).
          </li>
          <li>
            <strong>REDIS_URL</strong> — e.g. install Redis locally or use a cloud Redis; URL like{" "}
            <code>redis://127.0.0.1:6379</code>.
          </li>
          <li>
            <strong>JWT_SECRET</strong> — long random string (any password generator).
          </li>
          <li>
            <strong>SESSION_ENCRYPTION_KEY</strong> — 32+ random characters (encrypts Telegram sessions in DB).
          </li>
          <li>
            <strong>WEB_ORIGIN</strong> — main URL of your web app(e.g. <code>http://localhost:3000</code>).
          </li>
        </ul>
      </section>
    </div>
  );
}
