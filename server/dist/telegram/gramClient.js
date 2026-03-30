import { TelegramClient, sessions, Api, password as tgPassword } from "telegram";
import { decryptSession } from "../crypto/sessionCrypto.js";
import { assertTelegramConfigured, getRuntimeSettings } from "../services/runtimeSettings.js";
const { StringSession } = sessions;
const { computeCheck } = tgPassword;
function parseProxyUrl(urlStr) {
    if (!urlStr?.trim())
        return undefined;
    try {
        const u = new URL(urlStr);
        const host = u.hostname;
        const port = u.port ? parseInt(u.port, 10) : 1080;
        if (!host)
            return undefined;
        const socksType = u.protocol === "socks4:" ? 4 : 5;
        const base = {
            ip: host,
            port,
            socksType,
        };
        if (u.username)
            base.username = decodeURIComponent(u.username);
        if (u.password)
            base.password = decodeURIComponent(u.password);
        return base;
    }
    catch {
        return undefined;
    }
}
export async function createClientForAccount(account) {
    const cfg = await getRuntimeSettings();
    assertTelegramConfigured(cfg);
    const enc = account.sessionEncrypted;
    if (!enc)
        throw new Error("Missing session for account");
    const session = new StringSession(decryptSession(enc));
    const proxy = parseProxyUrl(account.proxyUrl ?? undefined);
    return new TelegramClient(session, cfg.telegramApiId, cfg.telegramApiHash, {
        connectionRetries: 5,
        deviceModel: "Growth Console",
        appVersion: "1.0.0",
        ...(proxy ? { proxy } : {}),
    });
}
export async function createEmptyClient() {
    const cfg = await getRuntimeSettings();
    assertTelegramConfigured(cfg);
    return new TelegramClient(new StringSession(""), cfg.telegramApiId, cfg.telegramApiHash, {
        connectionRetries: 5,
    });
}
export async function sendLoginCode(client, phone) {
    const c = await getRuntimeSettings();
    assertTelegramConfigured(c);
    await client.connect();
    const sent = await client.sendCode({ apiId: c.telegramApiId, apiHash: c.telegramApiHash }, phone);
    return sent.phoneCodeHash;
}
export async function completeLoginWithOtp(client, phone, phoneCode, phoneCodeHash, password) {
    await client.connect();
    try {
        await client.invoke(new Api.auth.SignIn({
            phoneNumber: phone,
            phoneCodeHash,
            phoneCode,
        }));
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("SESSION_PASSWORD_NEEDED")) {
            if (!password)
                return { ok: false, needsPassword: true };
            try {
                const pwdInfo = await client.invoke(new Api.account.GetPassword());
                const check = await computeCheck(pwdInfo, password);
                await client.invoke(new Api.auth.CheckPassword({ password: check }));
            }
            catch (e2) {
                return { ok: false, error: e2 instanceof Error ? e2.message : String(e2) };
            }
        }
        else {
            return { ok: false, error: msg };
        }
    }
    const raw = client.session.save();
    const sessionString = raw ?? "";
    if (!sessionString)
        return { ok: false, error: "Empty session after login" };
    return { ok: true, sessionString };
}
export function isFloodError(err) {
    const s = err instanceof Error ? err.message : String(err);
    return s.includes("FLOOD_WAIT") || s.includes("FLOOD");
}
export function floodSeconds(err) {
    const s = err instanceof Error ? err.message : String(err);
    const m = /FLOOD_WAIT_(\d+)/i.exec(s);
    return m ? parseInt(m[1], 10) : 3600;
}
export function isPeerFlood(err) {
    const s = err instanceof Error ? err.message : String(err);
    return s.includes("PEER_FLOOD");
}
export function isUserPrivacyRestricted(err) {
    const s = err instanceof Error ? err.message : String(err);
    return s.includes("USER_PRIVACY_RESTRICTED");
}
//# sourceMappingURL=gramClient.js.map