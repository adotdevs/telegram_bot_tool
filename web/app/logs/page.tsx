"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type LogRow = {
  _id: string;
  action: string;
  level: string;
  success: boolean;
  message: string;
  createdAt: string;
  campaignId?: string;
};

export default function LogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);

  useEffect(() => {
    api<LogRow[]>("/api/logs?limit=200").then(setRows);
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Action logs</h1>
      <ul className="space-y-2 text-sm">
        {rows.map((r) => (
          <li
            key={r._id}
            className={`rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800 ${
              r.level === "error" ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" : ""
            }`}
          >
            <span className="text-zinc-400">{new Date(r.createdAt).toLocaleString()}</span>
            <span className="ml-2 font-medium">{r.action}</span>
            <span className="ml-2">{r.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
