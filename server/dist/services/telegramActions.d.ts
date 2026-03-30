import type { TelegramClient } from "telegram";
import type { TelegramAccountDoc } from "../models/TelegramAccount.js";
import type { CampaignDoc } from "../models/Campaign.js";
import type { CampaignUserDoc } from "../models/CampaignUser.js";
export type ActionErr = {
    kind: "flood";
    seconds: number;
} | {
    kind: "peer_flood";
} | {
    kind: "privacy";
} | {
    kind: "other";
    message: string;
};
export declare function scrapeGroupParticipants(account: TelegramAccountDoc, groupUsernameOrLink: string): Promise<{
    ok: true;
    users: {
        telegramId: string;
        username?: string;
        accessHash?: string;
        isBot: boolean;
    }[];
} | ActionErr>;
export declare function addUserToTargetGroup(account: TelegramAccountDoc, campaign: CampaignDoc, cu: CampaignUserDoc): Promise<void | ActionErr>;
export declare function sendDirectMessage(account: TelegramAccountDoc, cu: CampaignUserDoc, text: string, typingMs: number, clientRef?: TelegramClient): Promise<void | ActionErr>;
//# sourceMappingURL=telegramActions.d.ts.map