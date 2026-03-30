import { TelegramClient } from "telegram";
import type { TelegramAccountDoc } from "../models/TelegramAccount.js";
export declare function createClientForAccount(account: TelegramAccountDoc): Promise<TelegramClient>;
export declare function createEmptyClient(): Promise<TelegramClient>;
export declare function sendLoginCode(client: TelegramClient, phone: string): Promise<string>;
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