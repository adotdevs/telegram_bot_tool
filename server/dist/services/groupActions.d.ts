import type { TelegramClient } from "telegram";
import type { TelegramAccountDoc } from "../models/TelegramAccount.js";
export type PostResult = {
    ok: true;
    messageId?: number;
} | {
    ok: false;
    error: string;
    skipped?: boolean;
};
/**
 * Parses spintax format like "{Hi|Hello|Hey} {friend|buddy}!"
 */
export declare function parseSpintax(text: string): string;
/**
 * Normalizes group input:
 * - "https://t.me/example" -> "example"
 * - "@example" -> "example"
 * - "https://t.me/+hash" -> { isInvite: true, hash: "hash" }
 */
export declare function parseGroupRef(input: string): {
    isInvite: boolean;
    ref: string;
};
/**
 * Prepares the final text with Spintax, optional synonyms, and optional OpenAI rewrites
 */
export declare function preparePostText(template: string, useAi: boolean): Promise<string>;
/**
 * Joins a group/channel if autoJoin is enabled, and posts the message.
 */
export declare function postToGroup(account: TelegramAccountDoc, groupInput: string, rawTemplate: string, opts: {
    autoJoin: boolean;
    useAi: boolean;
    clientRef?: TelegramClient;
}): Promise<PostResult>;
//# sourceMappingURL=groupActions.d.ts.map