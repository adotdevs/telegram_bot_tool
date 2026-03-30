"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, apiForm } from "@/lib/api";

type Campaign = {
  _id: string;
  name: string;
  status: string;
  messageTemplate: string;
  batchSize?: number;
  useAiVariations?: boolean;
  onlyActiveUsers?: boolean;
  stats: { scraped: number; added: number; messaged: number; failed: number; skipped?: number };
};

export default function CampaignDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [c, setC] = useState<Campaign | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await api<Campaign[]>("/api/campaigns");
    const one = rows.find((x) => x._id === id) ?? null;
    setC(one);
  }, [id]);

  useEffect(() => {
    load().catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, [load]);

  async function setStatus(status: "running" | "paused") {
    setErr(null);
    try {
      await api(`/api/campaigns/${id}`, { method: "PATCH", json: { status } });
      await load();
    } catch (x: unknown) {
      setErr(x instanceof Error ? x.message : "Error");
    }
  }

  async function patch(body: Record<string, unknown>) {
    setErr(null);
    try {
      await api(`/api/campaigns/${id}`, { method: "PATCH", json: body });
      await load();
    } catch (x: unknown) {
      setErr(x instanceof Error ? x.message : "Error");
    }
  }

  async function uploadCsv(file: File | null) {
    if (!file) return;
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await apiForm<{ merged: number; totalUsers: number }>(`/api/campaigns/${id}/csv`, fd);
      await load();
    } catch (x: unknown) {
      setErr(x instanceof Error ? x.message : "Error");
    }
  }

  if (err) return <p className="text-red-500">{err}</p>;
  if (!c) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{c.name}</h1>
        <p className="text-sm text-zinc-500">Status: {c.status}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-50"
          disabled={c.status === "running"}
          onClick={() => setStatus("running")}
        >
          Start
        </button>
        <button
          type="button"
          className="rounded-md bg-amber-600 px-3 py-2 text-sm text-white disabled:opacity-50"
          disabled={c.status !== "running"}
          onClick={() => setStatus("paused")}
        >
          Pause
        </button>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium">CSV merge</h2>
        <p className="mb-2 text-xs text-zinc-500">
          Columns: <code>username</code>, <code>user_id</code> / <code>telegram_id</code>
        </p>
        <input
          type="file"
          accept=".csv"
          className="text-sm"
          onChange={(e) => uploadCsv(e.target.files?.[0] ?? null)}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium">Message template</h2>
        <textarea
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          rows={4}
          defaultValue={c.messageTemplate}
          onBlur={(e) => {
            if (e.target.value !== c.messageTemplate) patch({ messageTemplate: e.target.value });
          }}
        />
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            defaultChecked={!!c.useAiVariations}
            onChange={(e) => patch({ useAiVariations: e.target.checked })}
          />
          AI variations (needs OPENAI_API_KEY on server)
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            defaultChecked={!!c.onlyActiveUsers}
            onChange={(e) => patch({ onlyActiveUsers: e.target.checked })}
          />
          Stricter “active user” gate (heuristic)
        </label>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["Scraped", c.stats?.scraped],
            ["Added", c.stats?.added],
            ["Messaged", c.stats?.messaged],
            ["Failed", c.stats?.failed],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">{k}</p>
            <p className="text-xl font-semibold tabular-nums">{v ?? 0}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
