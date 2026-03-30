import { Api } from "telegram";
import bigInt from "big-integer";
import type { TelegramClient } from "telegram";
import { createClientForAccount } from "../telegram/gramClient.js";
import type { TelegramAccountDoc } from "../models/TelegramAccount.js";
import type { CampaignDoc } from "../models/Campaign.js";
import type { CampaignUserDoc } from "../models/CampaignUser.js";
import {
  isFloodError,
  floodSeconds,
  isPeerFlood,
  isUserPrivacyRestricted,
} from "../telegram/gramClient.js";

export type ActionErr =
  | { kind: "flood"; seconds: number }
  | { kind: "peer_flood" }
  | { kind: "privacy" }
  | { kind: "other"; message: string };

export async function scrapeGroupParticipants(
  account: TelegramAccountDoc,
  groupUsernameOrLink: string
): Promise<
  { ok: true; users: { telegramId: string; username?: string; accessHash?: string; isBot: boolean }[] } | ActionErr
> {
  const client = await createClientForAccount(account);
  await client.connect();
  try {
    const entity = await client.getEntity(groupUsernameOrLink);
    const usersOut: {
      telegramId: string;
      username?: string;
      accessHash?: string;
      isBot: boolean;
    }[] = [];

    for await (const u of client.iterParticipants(entity, { limit: 5000 })) {
      if (!u.id) continue;
      const telegramId = u.id.toString();
      const isBot = "bot" in u && Boolean((u as { bot?: boolean }).bot);
      const username = "username" in u && u.username ? String(u.username) : undefined;
      let accessHash: string | undefined;
      if ("accessHash" in u && u.accessHash != null) {
        accessHash = u.accessHash.toString();
      }
      usersOut.push({ telegramId, username, accessHash: accessHash ?? undefined, isBot });
    }
    return { ok: true, users: usersOut };
  } catch (e: unknown) {
    if (isFloodError(e)) return { kind: "flood", seconds: floodSeconds(e) };
    if (isPeerFlood(e)) return { kind: "peer_flood" };
    return { kind: "other", message: e instanceof Error ? e.message : String(e) };
  } finally {
    await client.disconnect();
  }
}

function targetRef(campaign: CampaignDoc): string {
  return campaign.targetGroupLink?.trim() || campaign.targetGroupUsername?.trim() || "";
}

export async function addUserToTargetGroup(
  account: TelegramAccountDoc,
  campaign: CampaignDoc,
  cu: CampaignUserDoc
): Promise<void | ActionErr> {
  const client = await createClientForAccount(account);
  await client.connect();
  try {
    const target = targetRef(campaign);
    if (!target) return { kind: "other", message: "Missing target group" };

    const targetEnt = await client.getEntity(target);
    let userEnt: Api.TypeInputUser;
    const unPref = cu.telegramId.startsWith("UN:") ? cu.telegramId.slice(3) : null;
    if (cu.accessHash && !unPref) {
      userEnt = new Api.InputUser({
        userId: bigInt(cu.telegramId),
        accessHash: bigInt(cu.accessHash),
      });
    } else if (unPref || cu.username) {
      const name = unPref ?? cu.username!;
      const u = await client.getEntity(name);
      if (!(u instanceof Api.User)) return { kind: "other", message: "Could not resolve user" };
      if (u.accessHash == null) return { kind: "other", message: "Resolved user missing accessHash" };
      userEnt = new Api.InputUser({
        userId: bigInt(String(u.id)),
        accessHash: bigInt(String(u.accessHash)),
      });
    } else {
      return { kind: "other", message: "Need username or accessHash to invite" };
    }

    if (targetEnt instanceof Api.Channel || targetEnt instanceof Api.ChannelForbidden) {
      const ch = await client.getInputEntity(targetEnt);
      await client.invoke(
        new Api.channels.InviteToChannel({
          channel: ch,
          users: [userEnt],
        })
      );
    } else if (targetEnt instanceof Api.Chat) {
      await client.invoke(
        new Api.messages.AddChatUser({
          chatId: targetEnt.id,
          userId: userEnt,
          fwdLimit: 0,
        })
      );
    } else {
      return { kind: "other", message: "Unsupported target chat type" };
    }
  } catch (e: unknown) {
    if (isUserPrivacyRestricted(e)) return { kind: "privacy" };
    if (isFloodError(e)) return { kind: "flood", seconds: floodSeconds(e) };
    if (isPeerFlood(e)) return { kind: "peer_flood" };
    return { kind: "other", message: e instanceof Error ? e.message : String(e) };
  } finally {
    await client.disconnect();
  }
}

export async function sendDirectMessage(
  account: TelegramAccountDoc,
  cu: CampaignUserDoc,
  text: string,
  typingMs: number,
  clientRef?: TelegramClient
): Promise<void | ActionErr> {
  const ownClient = clientRef ? null : await createClientForAccount(account);
  const client = clientRef ?? ownClient!;
  if (!clientRef) await client.connect();
  try {
    const unPref = cu.telegramId.startsWith("UN:") ? cu.telegramId.slice(3) : null;
    const name = cu.username ?? unPref;
    if (!name && !cu.accessHash) {
      return { kind: "other", message: "Cannot DM without username/accessHash" };
    }
    const peer =
      name != null && name.length > 0
        ? name
        : new Api.InputPeerUser({
            userId: bigInt(cu.telegramId),
            accessHash: bigInt(cu.accessHash ?? "0"),
          });

    await client.invoke(
      new Api.messages.SetTyping({
        peer: await client.getInputEntity(peer as never),
        action: new Api.SendMessageTypingAction(),
      })
    );
    await new Promise((r) => setTimeout(r, typingMs));

    await client.sendMessage(peer as never, { message: text });
  } catch (e: unknown) {
    if (isUserPrivacyRestricted(e)) return { kind: "privacy" };
    if (isFloodError(e)) return { kind: "flood", seconds: floodSeconds(e) };
    if (isPeerFlood(e)) return { kind: "peer_flood" };
    return { kind: "other", message: e instanceof Error ? e.message : String(e) };
  } finally {
    if (!clientRef && ownClient) await ownClient.disconnect();
  }
}
