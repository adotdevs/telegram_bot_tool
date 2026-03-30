"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const r = await api<{ token: string }>(path, { method: "POST", json: { email, password } });
      localStorage.setItem("token", r.token);
      router.push("/");
    } catch (x: unknown) {
      setErr(x instanceof Error ? x.message : "Error");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Growth console</h1>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
        Sign in to manage Telegram campaigns and accounts.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength={8}
            required
          />
        </label>
        {err && <p className="text-sm text-red-500">{err}</p>}
        <button
          type="submit"
          className="rounded-md bg-zinc-900 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button
        type="button"
        className="mt-4 text-sm text-zinc-500 underline"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
