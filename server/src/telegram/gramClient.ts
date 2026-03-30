import { TelegramClient, sessions, Api, password as tgPassword } from "telegram";
import type { SocksProxyType } from "telegram/network/connection/TCPMTProxy.js";
import type { TelegramAccountDoc } from "../models/TelegramAccount.js";
import { decryptSession } from "../crypto/sessionCrypto.js";
import { assertTelegramConfigured, getRuntimeSettings } from "../services/runtimeSettings.js";

const { StringSession } = sessions;
const { computeCheck } = tgPassword;

/** GramJS RPC errors expose `errorMessage` (e.g. PHONE_CODE_INVALID). */
export function formatTelegramAuthError(e: unknown): string {
  if (e && typeof e === "object" && "errorMessage" in e) {
    const em = String((e as { errorMessage?: string }).errorMessage || "");
    if (em) return em;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

function normalizeLoginPhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

function normalizeOtp(code: string): string {
  return code.replace(/[\s-]/g, "");
}

function parseProxyUrl(urlStr: string | undefined): SocksProxyType | undefined {
  if (!urlStr?.trim()) return undefined;
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    const port = u.port ? parseInt(u.port, 10) : 1080;
    if (!host) return undefined;
    const socksType: 4 | 5 = u.protocol === "socks4:" ? 4 : 5;
    const base: SocksProxyType = {
      ip: host,
      port,
      socksType,
    };
    if (u.username) base.username = decodeURIComponent(u.username);
    if (u.password) base.password = decodeURIComponent(u.password);
    return base;
  } catch {
    return undefined;
  }
}

export async function createClientForAccount(account: TelegramAccountDoc): Promise<TelegramClient> {
  const cfg = await getRuntimeSettings();
  assertTelegramConfigured(cfg);
  const enc = account.sessionEncrypted;
  if (!enc) throw new Error("Missing session for account");
  const session = new StringSession(decryptSession(enc));
  const proxy = parseProxyUrl(account.proxyUrl ?? undefined);
  return new TelegramClient(session, cfg.telegramApiId, cfg.telegramApiHash, {
    connectionRetries: 5,
    deviceModel: "Growth Console",
    appVersion: "1.0.0",
    ...(proxy ? { proxy } : {}),
  });
}

export type EmptyClientOptions = {
  /** Optional SOCKS proxy — required for login on some networks. Cannot combine with WSS (GramJS). */
  proxyUrl?: string;
};

export async function createEmptyClient(opts?: EmptyClientOptions): Promise<TelegramClient> {
  const cfg = await getRuntimeSettings();
  assertTelegramConfigured(cfg);
  const proxy = parseProxyUrl(opts?.proxyUrl);
  const useWSS = !proxy;
  return new TelegramClient(new StringSession(""), cfg.telegramApiId, cfg.telegramApiHash, {
    connectionRetries: 10,
    timeout: 30,
    /** 443 when no proxy; plain MTProto when proxy is set (library disallows WSS+proxy). */
    useWSS,
    ...(proxy ? { proxy } : {}),
  });
}

/**
 * OTP verify must continue the same MTProto session as `sendCode` (same auth key + DC).
 * A fresh empty client often yields PHONE_CODE_EXPIRED even when the code and hash are correct.
 */
export async function createClientForOtpVerify(
  loginSession: string | undefined,
  opts?: EmptyClientOptions
): Promise<TelegramClient> {
  const raw = loginSession?.trim() ?? "";
  if (!raw) {
    return createEmptyClient(opts);
  }
  const cfg = await getRuntimeSettings();
  assertTelegramConfigured(cfg);
  const proxy = parseProxyUrl(opts?.proxyUrl);
  const useWSS = !proxy;
  return new TelegramClient(new StringSession(raw), cfg.telegramApiId, cfg.telegramApiHash, {
    connectionRetries: 10,
    timeout: 30,
    useWSS,
    ...(proxy ? { proxy } : {}),
  });
}

export async function sendLoginCode(
  client: TelegramClient,
  phone: string
): Promise<{ phoneCodeHash: string; phone: string; isCodeViaApp: boolean }> {
  const c = await getRuntimeSettings();
  assertTelegramConfigured(c);
  const pn = normalizeLoginPhone(phone);
  const connected = await client.connect();
  if (!connected) {
    throw new Error(
      "Could not connect to Telegram. Try again, toggle VPN off/on, or allow outbound HTTPS (443)."
    );
  }
  /**
   * Do not pass forceSMS=true: GramJS then calls auth.ResendCode for non-SMS deliveries, which often fails with
   * SEND_CODE_UNAVAILABLE (406) for many countries/carriers. Default path uses Telegram's chosen channel (in-app or SMS).
   */
  const sent = await client.sendCode({ apiId: c.telegramApiId, apiHash: c.telegramApiHash }, pn);
  return { phoneCodeHash: sent.phoneCodeHash, phone: pn, isCodeViaApp: sent.isCodeViaApp };
}

export type SignInResult =
  | { ok: true; sessionString: string }
  | { ok: false; needsPassword: true }
  | { ok: false; error: string };

export async function completeLoginWithOtp(
  client: TelegramClient,
  phone: string,
  phoneCode: string,
  phoneCodeHash: string,
  password?: string
): Promise<SignInResult> {
  const pn = normalizeLoginPhone(phone);
  const pc = normalizeOtp(phoneCode);
  const hash = phoneCodeHash.trim();

  const connected = await client.connect();
  if (!connected) {
    return {
      ok: false,
      error:
        "Could not connect to Telegram for sign-in. Retry, or try another network (e.g. mobile hotspot).",
    };
  }

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: pn,
        phoneCodeHash: hash,
        phoneCode: pc,
      })
    );
  } catch (e: unknown) {
    const rpc = formatTelegramAuthError(e);
    const msg = rpc + (e instanceof Error && e.message !== rpc ? ` (${e.message})` : "");
    const needPw =
      rpc === "SESSION_PASSWORD_NEEDED" || msg.includes("SESSION_PASSWORD_NEEDED");
    if (needPw) {
      if (!password) return { ok: false, needsPassword: true };
      try {
        const pwdInfo = await client.invoke(new Api.account.GetPassword());
        const check = await computeCheck(pwdInfo, password);
        await client.invoke(new Api.auth.CheckPassword({ password: check }));
      } catch (e2: unknown) {
        return { ok: false, error: formatTelegramAuthError(e2) };
      }
    } else {
      if (rpc === "PHONE_CODE_INVALID" || rpc === "PHONE_CODE_EXPIRED") {
        return {
          ok: false,
          error: `${rpc}: Telegram invalidated this attempt (wrong code, stale hash, or waited too long). Tap Send code again and enter only the newest code from SMS or the Telegram app prompt (digits only). Each Send code replaces the previous one.`,
        };
      }
      return { ok: false, error: msg };
    }
  }
  const raw = client.session.save() as unknown as string | null | undefined;
  const sessionString = raw ?? "";
  if (!sessionString) return { ok: false, error: "Empty session after login" };
  return { ok: true, sessionString };
}

export function isFloodError(err: unknown): boolean {
  const s = err instanceof Error ? err.message : String(err);
  return s.includes("FLOOD_WAIT") || s.includes("FLOOD");
}

export function floodSeconds(err: unknown): number {
  const s = err instanceof Error ? err.message : String(err);
  const m = /FLOOD_WAIT_(\d+)/i.exec(s);
  return m ? parseInt(m[1]!, 10) : 3600;
}

export function isPeerFlood(err: unknown): boolean {
  const s = err instanceof Error ? err.message : String(err);
  return s.includes("PEER_FLOOD");
}

export function isUserPrivacyRestricted(err: unknown): boolean {
  const s = err instanceof Error ? err.message : String(err);
  return s.includes("USER_PRIVACY_RESTRICTED");
}
