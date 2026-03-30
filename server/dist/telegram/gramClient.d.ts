import { TelegramClient } from "telegram";
import type { TelegramAccountDoc } from "../models/TelegramAccount.js";
/** GramJS RPC errors expose `errorMessage` (e.g. PHONE_CODE_INVALID). */
export declare function formatTelegramAuthError(e: unknown): string;
export declare function createClientForAccount(account: TelegramAccountDoc): Promise<TelegramClient>;
export type EmptyClientOptions = {
    /** Optional SOCKS proxy — required for login on some networks. Cannot combine with WSS (GramJS). */
    proxyUrl?: string;
};
export declare function createEmptyClient(opts?: EmptyClientOptions): Promise<TelegramClient>;
/**
 * OTP verify must continue the same MTProto session as `sendCode` (same auth key + DC).
 * A fresh empty client often yields PHONE_CODE_EXPIRED even when the code and hash are correct.
 */
export declare function createClientForOtpVerify(loginSession: string | undefined, opts?: EmptyClientOptions): Promise<TelegramClient>;
export declare function sendLoginCode(client: TelegramClient, phone: string): Promise<{
    phoneCodeHash: string;
    phone: string;
    isCodeViaApp: boolean;
}>;
export type SignInResult = {
    ok: true;
    sessionString: string;
} | {
    ok: false;
    needsPassword: true;
} | {
    ok: false;
    error: string;
};
export declare function completeLoginWithOtp(client: TelegramClient, phone: string, phoneCode: string, phoneCodeHash: string, password?: string): Promise<SignInResult>;
export declare function isFloodError(err: unknown): boolean;
export declare function floodSeconds(err: unknown): number;
export declare function isPeerFlood(err: unknown): boolean;
export declare function isUserPrivacyRestricted(err: unknown): boolean;
//# sourceMappingURL=gramClient.d.ts.map