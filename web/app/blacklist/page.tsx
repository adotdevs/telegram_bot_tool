"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Row = { _id: string; telegramId: string; reason?: string };

export default function BlacklistPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [telegramId, setTid] = useState("");
  const [reason, setReason] = useState("");

  async function load() {
    setRows(await api<Row[]>("/api/blacklist"));
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/blacklist", { method: "POST", json: { telegramId, reason: reason || undefined } });
    setTid("");
    setReason("");
    await load();
  }

  async function remove(id: string) {
    await api(`/api/blacklist/${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Blacklist</h1>
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          placeholder="Telegram numeric ID"
          value={telegramId}
          onChange={(e) => setTid(e.target.value)}
          required
        />
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Add
        </button>
      </form>
      <ul className="text-sm">
        {rows.map((r) => (
          <li key={r._id} className="flex items-center justify-between border-b border-zinc-100 py-2 dark:border-zinc-800">
            <span>
              {r.telegramId} {r.reason && <span className="text-zinc-500">— {r.reason}</span>}
            </span>
            <button type="button" className="text-xs text-red-500" onClick={() => remove(r.telegramId)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
