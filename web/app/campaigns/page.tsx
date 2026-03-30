"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Campaign = {
  _id: string;
  name: string;
  status: string;
  stats: { scraped: number; added: number; messaged: number; failed: number; skipped?: number };
};

export default function CampaignsPage() {
  const [list, setList] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("Hey {first_name}, quick note — we are building something interesting.");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const rows = await api<Campaign[]>("/api/campaigns", { method: "GET" });
    setList(rows);
  }

  useEffect(() => {
    load().catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api("/api/campaigns", {
        method: "POST",
        json: {
          name,
          messageTemplate: template,
          sourceGroupUsername: source || undefined,
          targetGroupUsername: target || undefined,
          batchSize: 75,
        },
      });
      setName("");
      setSource("");
      setTarget("");
      await load();
    } catch (x: unknown) {
      setErr(x instanceof Error ? x.message : "Error");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Campaigns</h1>

      <form
        onSubmit={create}
        className="mb-10 space-y-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">New campaign</h2>
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          placeholder="Source group @username or link (optional if CSV only)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          placeholder="Target group @username or t.me link"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <textarea
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          rows={3}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
        {err && <p className="text-sm text-red-500">{err}</p>}
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Save draft
        </button>
      </form>

      <ul className="space-y-2">
        {list.map((c) => (
          <li key={c._id}>
            <Link
              href={`/campaigns/${c._id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/80"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-zinc-500">{c.status}</span>
              <span className="tabular-nums text-zinc-500">
                +{c.stats?.added ?? 0} / ✉{c.stats?.messaged ?? 0} / pool {c.stats?.scraped ?? 0}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
