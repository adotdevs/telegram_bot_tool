"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Acc = {
  _id: string;
  phoneNumber: string;
  label?: string;
  status: string;
  warmUpMode?: boolean;
  proxyUrl?: string;
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
      await load();
    } catch (x: unknown) {
      setErr(x instanceof Error ? x.message : "Error");
    }
  }

  async function toggleWarm(id: string, warmUpMode: boolean) {
    await api(`/api/telegram-accounts/${id}`, { method: "PATCH", json: { warmUpMode } });
    await load();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Telegram accounts</h1>

      <form
        onSubmit={step === "idle" ? sendCode : verify}
        className="max-w-md space-y-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-medium">Link account (phone OTP)</h2>
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          placeholder="+1..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={step === "coded"}
          required
        />
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
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
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
              placeholder="Telegram login code (digits only)"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
              placeholder="2FA password if asked"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </>
        )}
        {err && <p className="text-sm text-red-500">{err}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {step === "idle" ? "Send code" : "Verify & store session"}
          </button>
          {step === "coded" && (
            <button
              type="button"
              onClick={cancelCodeStep}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
            >
              Cancel — request a new code
            </button>
          )}
        </div>
      </form>

      <ul className="space-y-2">
        {list.map((a) => (
          <li
            key={a._id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
          >
            <div>
              <span className="font-medium">{a.label || a.phoneNumber}</span>
              <span className="ml-2 text-zinc-500">{a.status}</span>
              {a.proxyUrl && <span className="ml-2 text-xs text-zinc-400">(proxy)</span>}
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!a.warmUpMode}
                onChange={(e) => toggleWarm(a._id, e.target.checked)}
              />
              Warm-up (lower caps)
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
