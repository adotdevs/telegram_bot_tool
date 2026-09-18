"use client";

import { useEffect, useState, useTransition } from "react";
import { api } from "@/lib/api";

type TelegramAccount = {
  _id: string;
  phoneNumber: string;
  label?: string;
  status: string;
};

type LogItem = {
  timestamp: string;
  group: string;
  accountPhone: string;
  status: "success" | "failed" | "skipped";
  message: string;
};

type AutoPostSchedule = {
  _id: string;
  name: string;
  status: "active" | "paused" | "draft";
  accountIds: string[];
  targetGroups: string[];
  messageTemplate: string;
  intervalMinutes: number;
  useAiVariations: boolean;
  autoJoinGroups: boolean;
  delayBetweenGroupsSeconds: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  stats: {
    totalRuns: number;
    totalPosts: number;
    successfulPosts: number;
    failedPosts: number;
  };
  lastLog?: string;
  recentLogs?: LogItem[];
};

export default function AutoPostPage() {
  const [schedules, setSchedules] = useState<AutoPostSchedule[]>([]);
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<AutoPostSchedule | null>(null);
  const [, startTransition] = useTransition();

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formGroups, setFormGroups] = useState("");
  const [formTemplate, setFormTemplate] = useState(
    "{Hey|Hello|Hi} everyone! {Check out|Discover} our official updates here: https://t.me/example"
  );
  const [formInterval, setFormInterval] = useState(60);
  const [formDelay, setFormDelay] = useState(12);
  const [formAccounts, setFormAccounts] = useState<string[]>([]);
  const [formAutoJoin, setFormAutoJoin] = useState(true);
  const [formUseAi, setFormUseAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function loadData() {
    try {
      setErr(null);
      const [schedList, accList] = await Promise.all([
        api<AutoPostSchedule[]>("/api/auto-post"),
        api<TelegramAccount[]>("/api/telegram-accounts"),
      ]);
      setSchedules(schedList);
      setAccounts(accList);
      if (selectedLogs) {
        const refreshed = schedList.find((s) => s._id === selectedLogs._id);
        if (refreshed) setSelectedLogs(refreshed);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Poll every 10s for status updates
    return () => clearInterval(interval);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);

    const groupList = formGroups
      .split("\n")
      .map((g) => g.trim())
      .filter(Boolean);

    if (groupList.length === 0) {
      setErr("Please provide at least one target group");
      setSubmitting(false);
      return;
    }

    try {
      await api("/api/auto-post", {
        method: "POST",
        json: {
          name: formName,
          targetGroups: groupList,
          messageTemplate: formTemplate,
          intervalMinutes: Number(formInterval),
          delayBetweenGroupsSeconds: Number(formDelay),
          accountIds: formAccounts.length > 0 ? formAccounts : undefined,
          autoJoinGroups: formAutoJoin,
          useAiVariations: formUseAi,
          status: "active",
        },
      });

      // Reset form
      setFormName("");
      setFormGroups("");
      setShowForm(false);
      setActionMessage("Scheduled auto-post task created and started!");
      setTimeout(() => setActionMessage(null), 5000);
      await loadData();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await api(`/api/auto-post/${id}/toggle`, { method: "POST" });
      await loadData();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Toggle failed");
    }
  }

  async function handleRunNow(id: string) {
    try {
      setActionMessage("Triggered immediate post run. Refreshing...");
      await api(`/api/auto-post/${id}/run-now`, { method: "POST" });
      setTimeout(loadData, 2000);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Trigger failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this scheduled task?")) return;
    try {
      await api(`/api/auto-post/${id}`, { method: "DELETE" });
      if (selectedLogs?._id === id) setSelectedLogs(null);
      await loadData();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  }

  // Calculate totals
  const totalTasks = schedules.length;
  const activeTasks = schedules.filter((s) => s.status === "active").length;
  const totalSuccessful = schedules.reduce((acc, s) => acc + (s.stats?.successfulPosts || 0), 0);
  const totalFailed = schedules.reduce((acc, s) => acc + (s.stats?.failedPosts || 0), 0);

  function formatTimeRemaining(nextRunAt: string | null): string {
    if (!nextRunAt) return "Not scheduled";
    const diff = new Date(nextRunAt).getTime() - Date.now();
    if (diff <= 0) return "Running now / due soon";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins} min${mins === 1 ? "" : "s"}`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `in ${hrs}h ${remMins}m`;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Telegram Group Auto-Poster
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Automate recurring posts to public & private groups every 1 hour (or custom intervals)
            using your connected Telegram accounts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          {showForm ? "Cancel" : "+ New Auto-Post Task"}
        </button>
      </div>

      {/* Notifications */}
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          {err}
        </div>
      )}
      {actionMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          {actionMessage}
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Tasks</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{totalTasks}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Schedules</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {activeTasks}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Successful Posts</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">
            {totalSuccessful}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Failed / Restricted</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
            {totalFailed}
          </p>
        </div>
      </div>

      {/* Create Task Form Modal/Section */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-6 rounded-2xl border border-emerald-500/30 bg-white p-6 shadow-md dark:border-emerald-500/20 dark:bg-zinc-900"
        >
          <div className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Create New Auto-Post Task
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure your message, target Telegram groups, and recurring schedule interval.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Task Name */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Task Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hourly Crypto Promo"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Posting Interval */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Posting Interval *
              </label>
              <select
                value={formInterval}
                onChange={(e) => setFormInterval(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value={15}>Every 15 minutes (Testing only)</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every 1 hour (Recommended)</option>
                <option value={120}>Every 2 hours</option>
                <option value={240}>Every 4 hours</option>
                <option value={360}>Every 6 hours</option>
                <option value={720}>Every 12 hours</option>
                <option value={1440}>Every 24 hours (Once a day)</option>
              </select>
            </div>
          </div>

          {/* Account Picker */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Sender Telegram Account(s)
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Select which accounts will post. If none selected, all active accounts will rotate.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {accounts.length === 0 ? (
                <p className="text-xs text-amber-500">
                  No linked Telegram accounts found. Please link an account in the Accounts tab first.
                </p>
              ) : (
                accounts.map((acc) => {
                  const isChecked = formAccounts.includes(acc._id);
                  return (
                    <button
                      key={acc._id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setFormAccounts(formAccounts.filter((id) => id !== acc._id));
                        } else {
                          setFormAccounts([...formAccounts, acc._id]);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        isChecked
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          acc.status === "active" ? "bg-emerald-500" : "bg-zinc-400"
                        }`}
                      />
                      {acc.phoneNumber} {acc.label ? `(${acc.label})` : ""}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Target Groups */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Target Groups List * (One group per line)
              </label>
              <span className="text-xs text-zinc-500">
                {formGroups.split("\n").filter((g) => g.trim()).length} groups entered
              </span>
            </div>
            <textarea
              required
              rows={4}
              placeholder={"@example_group\nhttps://t.me/another_group\nhttps://t.me/+privateInviteHash"}
              value={formGroups}
              onChange={(e) => setFormGroups(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 font-mono text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Supports <code>@usernames</code>, public links <code>https://t.me/group</code>, and
              private invite links <code>https://t.me/+hash</code>.
            </p>
          </div>

          {/* Message Template with Spintax */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Message Content & Spintax Template *
              </label>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                Spintax enabled: &#123;Option 1|Option 2&#125;
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={formTemplate}
              onChange={(e) => setFormTemplate(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              💡 Tip: Use Spintax syntax like{" "}
              <code>&#123;Hello|Hey|Hi&#125; everyone, &#123;check out|look at&#125; our project!</code>{" "}
              to randomly rotate words each hour to protect against spam filters.
            </p>
          </div>

          {/* Advanced Toggles */}
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 text-xs dark:border-zinc-800">
              <input
                type="checkbox"
                checked={formAutoJoin}
                onChange={(e) => setFormAutoJoin(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Auto-Join Groups
                </span>
                <p className="text-zinc-500">Join group if not yet a member</p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 text-xs dark:border-zinc-800">
              <input
                type="checkbox"
                checked={formUseAi}
                onChange={(e) => setFormUseAi(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  AI Variations
                </span>
                <p className="text-zinc-500">Rewrite via OpenAI (if key set)</p>
              </div>
            </label>

            <div className="rounded-lg border border-zinc-200 p-3 text-xs dark:border-zinc-800">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                Delay Between Groups
              </span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={formDelay}
                  onChange={(e) => setFormDelay(Number(e.target.value))}
                  className="w-16 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
                <span className="text-zinc-500">seconds gap</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-700"
            >
              {submitting ? "Saving..." : "Start Auto-Poster Task"}
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Scheduled Posting Tasks
        </h2>

        {loading ? (
          <p className="py-8 text-center text-sm text-zinc-500">Loading schedules...</p>
        ) : schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No auto-post schedules found.
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Click &quot;+ New Auto-Post Task&quot; above to set up automated hourly posting to your
              groups.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {schedules.map((item) => (
              <div
                key={item._id}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Title & Status */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                          {item.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.status === "active"
                                ? "animate-pulse bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {item.status.toUpperCase()}
                        </span>
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          Every {item.intervalMinutes}m
                        </span>
                      </div>
                      <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Template: &quot;{item.messageTemplate}&quot;
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRunNow(item._id)}
                        title="Trigger immediately without waiting for interval"
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                      >
                        ⚡ Run Now
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(item._id)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                          item.status === "active"
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {item.status === "active" ? "⏸️ Pause" : "▶️ Resume"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLogs(item)}
                        className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        📜 Logs ({item.recentLogs?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="rounded-md px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
                    <div>
                      Target Groups:{" "}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {item.targetGroups.length}
                      </span>
                    </div>
                    <div>
                      Next Run:{" "}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {item.status === "active"
                          ? formatTimeRemaining(item.nextRunAt)
                          : "Paused"}
                      </span>
                    </div>
                    <div>
                      Last Run:{" "}
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {item.lastRunAt
                          ? new Date(item.lastRunAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </span>
                    </div>
                    <div>
                      Stats:{" "}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.stats?.successfulPosts || 0} sent
                      </span>
                      {" / "}
                      <span className="font-semibold text-red-500">
                        {item.stats?.failedPosts || 0} failed
                      </span>
                    </div>
                  </div>

                  {item.lastLog && (
                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="font-mono text-[11px] text-zinc-400">Last activity:</span>{" "}
                      {item.lastLog}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logs Drawer / Modal */}
      {selectedLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Execution Logs: {selectedLogs.name}
                </h3>
                <p className="text-xs text-zinc-500">Recent 30 group posting events</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogs(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto p-6 text-xs">
              {!selectedLogs.recentLogs || selectedLogs.recentLogs.length === 0 ? (
                <p className="py-6 text-center text-zinc-500">No logs recorded yet.</p>
              ) : (
                selectedLogs.recentLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start justify-between rounded-lg border p-3 ${
                      log.status === "success"
                        ? "border-emerald-100 bg-emerald-50/50 dark:border-emerald-950/40 dark:bg-emerald-950/20"
                        : log.status === "skipped"
                          ? "border-amber-100 bg-amber-50/50 dark:border-amber-950/40 dark:bg-amber-950/20"
                          : "border-red-100 bg-red-50/50 dark:border-red-950/40 dark:bg-red-950/20"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            log.status === "success"
                              ? "text-emerald-700 dark:text-emerald-300"
                              : log.status === "skipped"
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-red-700 dark:text-red-300"
                          }`}
                        >
                          {log.group}
                        </span>
                        <span className="rounded bg-zinc-200 px-1.5 py-0.2 text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          Account: {log.accountPhone || "Auto"}
                        </span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-300">{log.message}</p>
                    </div>
                    <span className="whitespace-nowrap font-mono text-[10px] text-zinc-400">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedLogs(null)}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
