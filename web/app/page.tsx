"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Summary = {
  totalUsersScraped: number;
  totalAdded: number;
  totalMessaged: number;
  totalFailed: number;
  activeAccounts: number;
};

export default function DashboardPage() {
  const [s, setS] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<Summary>("/api/dashboard/summary")
      .then(setS)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, []);

  if (err) return <p className="text-red-500">{err}</p>;
  if (!s) return <p className="text-zinc-500">Loading…</p>;

  const cards = [
    ["Scraped contacts", s.totalUsersScraped],
    ["Added to group", s.totalAdded],
    ["DMs sent", s.totalMessaged],
    ["Failed / errors", s.totalFailed],
    ["Active accounts", s.activeAccounts],
  ] as const;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-8 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Aggregated pipeline stats. Actions run through delayed BullMQ jobs with rate limits per Telegram account (see{" "}
        <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">server .env</code>).
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
