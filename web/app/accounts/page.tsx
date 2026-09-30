"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Acc = {
  _id: string;
  phoneNumber: string;
  label?: string;
  status: "active" | "paused" | "flood_wait" | "peer_flood_risky" | "disabled" | "session_expired" | string;
  warmUpMode?: boolean;
  proxyUrl?: string;
  sessionError?: string;
};

export default function AccountsPage() {
  const [list, setList] = useState<Acc[]>([]);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [hash, setHash] = useState("");
  const [loginSession, setLoginSession] = useState("");
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState("");
  const [proxyUrl, setProxyUrl] = useState("");
  const [step, setStep] = useState<"idle" | "coded">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setList(await api<Acc[]>("/api/telegram-accounts"));
  }

  useEffect(() => {
    load().catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, []);

  function cancelCodeStep() {
    setStep("idle");
    setCode("");
    setHash("");
    setLoginSession("");
    setPassword("");
    setErr(null);
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setActionInfo(null);
    try {
      const r = await api<{
        phoneCodeHash: string;
        phone: string;
        loginSession: string;
        isCodeViaApp?: boolean;
        requestedAt?: string;
      }>("/api/telegram-accounts/send-code", {
        method: "POST",
        json: { phone, proxyUrl: proxyUrl || undefined },
      });
      setPhone(r.phone);
      setHash(r.phoneCodeHash);
      setLoginSession(r.loginSession);
      setStep("coded");
    } catch (x: unknown) {
      setErr(x instanceof Error ? x.message : "Error");
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setActionInfo(null);
    try {
      await api("/api/telegram-accounts/verify", {
        method: "POST",
        json: {
          phone,
          phoneCode: code,
          phoneCodeHash: hash,
          loginSession,
          password: password || undefined,
          label: label || undefined,
          proxyUrl: proxyUrl || undefined,
        },
      });
      setStep("idle");
      setCode("");
      setHash("");
      setLoginSession("");
      setActionInfo("Account linked successfully!");
      setTimeout(() => setActionInfo(null), 4000);
      await load();
    } catch (x: unknown) {
      setErr(x instanceof Error ? x.message : "Error");
    }
  }

  async function toggleWarm(id: string, warmUpMode: boolean) {
    await api(`/api/telegram-accounts/${id}`, { method: "PATCH", json: { warmUpMode } });
    await load();
  }

  async function handleDelete(id: string, phoneNumber: string) {
    if (!confirm(`Are you sure you want to delete account ${phoneNumber}? Any saved session will be removed.`)) {
      return;
    }
    setDeletingId(id);
    setErr(null);
    setActionInfo(null);
    try {
      await api(`/api/telegram-accounts/${id}`, { method: "DELETE" });
      setActionInfo(`Account ${phoneNumber} deleted successfully.`);
      setTimeout(() => setActionInfo(null), 4000);
      await load();
    } catch (x: unknown) {
      setErr(x instanceof Error ? x.message : "Failed to delete account");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTestSession(id: string, phoneNumber: string) {
    setTestingId(id);
    setErr(null);
    setActionInfo(null);
    try {
      const res = await api<{
        ok: boolean;
        status: string;
        message?: string;
        error?: string;
        isExpired?: boolean;
      }>(`/api/telegram-accounts/${id}/test`, { method: "POST" });

      if (res.ok) {
        setActionInfo(`✓ Session for ${phoneNumber} is active & valid!`);
      } else if (res.isExpired || res.status === "session_expired") {
        setErr(`⚠️ Session expired for ${phoneNumber} (${res.error || "AUTH_KEY_UNREGISTERED"}). Please delete and re-login.`);
      } else {
        setErr(`Connection test issue for ${phoneNumber}: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setActionInfo(null), 5000);
      await load();
    } catch (x: unknown) {
      setErr(x instanceof Error ? x.message : "Test failed");
    } finally {
      setTestingId(null);
    }
  }

  const hasExpired = list.some((a) => a.status === "session_expired");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Telegram accounts</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Manage your connected Telegram sessions for outreach and auto-posting.
          </p>
        </div>
      </div>

      {/* Global Session Expired Warning Banner */}
      {hasExpired && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Action Required: Account Session Expired
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Telegram invalidated or revoked the login session (401: AUTH_KEY_UNREGISTERED) for one or more accounts below. Auto-posting and campaign actions will fail for expired accounts.
              </p>
              <p className="text-xs font-medium text-rose-800 dark:text-rose-200">
                👉 Click <strong>Delete</strong> on the expired account, then use the form below to link it again with a fresh login code.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {actionInfo && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          {actionInfo}
        </div>
      )}
      {err && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {err}
        </div>
      )}

      {/* Link Account Form */}
      <form
        onSubmit={step === "idle" ? sendCode : verify}
        className="max-w-md space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Link account (phone OTP)</h2>
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
          placeholder="+1..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={step === "coded"}
          required
        />
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
          placeholder="Socks proxy socks5://user:pass@host:port (optional, use for Send code + verify)"
          value={proxyUrl}
          onChange={(e) => setProxyUrl(e.target.value)}
          disabled={step === "coded"}
        />
        {step === "coded" && (
          <>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Enter the <span className="font-medium">same code</span> Telegram shows for this login: either an <span className="font-medium">SMS</span> or a message inside the{" "}
              <span className="font-medium">Telegram app</span> on your phone (login prompt). Codes expire quickly; only the code from your{" "}
              <span className="font-medium">latest</span> Send code works.
            </p>
            <input
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
              placeholder="Telegram login code (digits only)"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
              placeholder="2FA password if asked"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {step === "idle" ? "Send code" : "Verify & store session"}
          </button>
          {step === "coded" && (
            <button
              type="button"
              onClick={cancelCodeStep}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancel — request a new code
            </button>
          )}
        </div>
      </form>

      {/* Account List */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Connected Accounts ({list.length})
        </h2>

        {list.length === 0 ? (
          <p className="py-6 text-sm text-zinc-500">No Telegram accounts linked yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {list.map((a) => {
              const isExpired = a.status === "session_expired";
              return (
                <li
                  key={a._id}
                  className={`flex flex-col justify-between gap-3 rounded-xl border p-4 shadow-sm transition sm:flex-row sm:items-center ${
                    isExpired
                      ? "border-rose-300 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/20"
                      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {a.label || a.phoneNumber}
                      </span>
                      {a.label && (
                        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          ({a.phoneNumber})
                        </span>
                      )}

                      {/* Status Chips */}
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-900/60 dark:text-rose-200 animate-pulse">
                          <span>⚠️</span>
                          <span>Session Expired</span>
                        </span>
                      ) : a.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : a.status === "flood_wait" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Flood Wait
                        </span>
                      ) : a.status === "peer_flood_risky" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                          Peer Flood Risky
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {a.status}
                        </span>
                      )}

                      {a.proxyUrl && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          proxy
                        </span>
                      )}
                    </div>

                    {isExpired && (
                      <p className="text-xs text-rose-700 dark:text-rose-300">
                        {a.sessionError || "Telegram logged out this session (AUTH_KEY_UNREGISTERED). Delete and link again."}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!a.warmUpMode}
                        onChange={(e) => toggleWarm(a._id, e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Warm-up</span>
                    </label>

                    {/* Test Session Button */}
                    <button
                      type="button"
                      disabled={testingId === a._id}
                      onClick={() => handleTestSession(a._id, a.phoneNumber)}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      title="Check if Telegram session is still valid"
                    >
                      {testingId === a._id ? (
                        <>
                          <span className="animate-spin text-xs">⏳</span>
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <span>🔄</span>
                          <span>Test</span>
                        </>
                      )}
                    </button>

                    {/* Delete Account Button */}
                    <button
                      type="button"
                      disabled={deletingId === a._id}
                      onClick={() => handleDelete(a._id, a.phoneNumber)}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50"
                      title="Delete account session"
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
