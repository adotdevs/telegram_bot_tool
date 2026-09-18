import { Api } from "telegram";
import type { TelegramClient } from "telegram";
import type { TelegramAccountDoc } from "../models/TelegramAccount.js";
import { createClientForAccount, isFloodError, floodSeconds, isPeerFlood } from "../telegram/gramClient.js";
import { maybeAiVary, synonymizeTemplate, varyStructure } from "./messageVariator.js";

export type PostResult =
  | { ok: true; messageId?: number }
  | { ok: false; error: string; skipped?: boolean };

/**
 * Parses spintax format like "{Hi|Hello|Hey} {friend|buddy}!"
 */
export function parseSpintax(text: string): string {
  let result = text;
  const spintaxRegex = /\{([^{}]+)\}/;
  let match: RegExpExecArray | null;

  while ((match = spintaxRegex.exec(result)) !== null) {
    const options = match[1]!.split("|");
    const chosen = options[Math.floor(Math.random() * options.length)] ?? "";
    result = result.slice(0, match.index) + chosen + result.slice(match.index + match[0].length);
  }
  return result;
}

/**
 * Normalizes group input:
 * - "https://t.me/example" -> "example"
 * - "@example" -> "example"
 * - "https://t.me/+hash" -> { isInvite: true, hash: "hash" }
 */
export function parseGroupRef(input: string): { isInvite: boolean; ref: string } {
  let s = input.trim();
  if (s.startsWith("@")) s = s.slice(1);

  // Invite link patterns:
  // https://t.me/+hash or t.me/+hash
  const invitePlusMatch = /t\.me\/\+([a-zA-Z0-9_-]+)/i.exec(s);
  if (invitePlusMatch?.[1]) {
    return { isInvite: true, ref: invitePlusMatch[1] };
  }

  // https://t.me/joinchat/hash
  const joinChatMatch = /t\.me\/joinchat\/([a-zA-Z0-9_-]+)/i.exec(s);
  if (joinChatMatch?.[1]) {
    return { isInvite: true, ref: joinChatMatch[1] };
  }

  // +hash
  if (s.startsWith("+")) {
    return { isInvite: true, ref: s.slice(1) };
  }

  // Standard link: https://t.me/groupname or t.me/groupname
  const standardLinkMatch = /t\.me\/([a-zA-Z0-9_]+)/i.exec(s);
  if (standardLinkMatch?.[1]) {
    return { isInvite: false, ref: standardLinkMatch[1] };
  }

  return { isInvite: false, ref: s };
}

/**
 * Prepares the final text with Spintax, optional synonyms, and optional OpenAI rewrites
 */
export async function preparePostText(template: string, useAi: boolean): Promise<string> {
  let text = parseSpintax(template);
  text = synonymizeTemplate(text);
  text = varyStructure(text);
  if (useAi) {
    text = await maybeAiVary(text, true);
  }
  return text.trim();
}

/**
 * Joins a group/channel if autoJoin is enabled, and posts the message.
 */
export async function postToGroup(
  account: TelegramAccountDoc,
  groupInput: string,
  rawTemplate: string,
  opts: {
    autoJoin: boolean;
    useAi: boolean;
    clientRef?: TelegramClient;
  }
): Promise<PostResult> {
  const ownClient = opts.clientRef ? null : await createClientForAccount(account);
  const client = opts.clientRef ?? ownClient!;
  if (!opts.clientRef) {
    await client.connect();
  }

  try {
    const { isInvite, ref } = parseGroupRef(groupInput);
    let entity: any;


    if (isInvite) {
      // Private invite link
      if (opts.autoJoin) {
        try {
          const res = await client.invoke(new Api.messages.ImportChatInvite({ hash: ref }));
          if ("chats" in res && res.chats.length > 0) {
            entity = res.chats[0];
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("USER_ALREADY_PARTICIPANT")) {
            // Already a member, try to resolve via dialogs
            const dialogs = await client.getDialogs({ limit: 100 });
            // Look for matching chat
            entity = dialogs.find((d) => d.entity)?.entity;
          } else if (msg.includes("INVITE_REQUEST_SENT")) {
            return { ok: false, error: "Join request sent (pending admin approval)", skipped: true };
          } else if (msg.includes("INVITE_HASH_EXPIRED")) {
            return { ok: false, error: "Invite link expired", skipped: true };
          } else if (msg.includes("INVITE_HASH_INVALID")) {
            return { ok: false, error: "Invite link invalid", skipped: true };
          } else {
            return { ok: false, error: `Join invite failed: ${msg}` };
          }
        }
      }
    } else {
      // Public username or link
      try {
        entity = await client.getEntity(ref);
      } catch (e: unknown) {
        return { ok: false, error: `Could not resolve group: ${e instanceof Error ? e.message : String(e)}` };
      }

      if (opts.autoJoin && entity) {
        try {
          if (entity instanceof Api.Channel || entity instanceof Api.ChannelForbidden) {
            const inputCh = await client.getInputEntity(entity);
            await client.invoke(new Api.channels.JoinChannel({ channel: inputCh }));
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          if (!msg.includes("USER_ALREADY_PARTICIPANT")) {
            if (msg.includes("CHANNELS_TOO_MUCH")) {
              return { ok: false, error: "Account has joined too many channels (limit reached)" };
            }
            if (msg.includes("CHANNEL_PRIVATE")) {
              return { ok: false, error: "Channel is private or requires invite link" };
            }
          }
        }
      }
    }

    if (!entity) {
      // Try resolving directly if ref is username
      try {
        entity = await client.getEntity(ref);
      } catch {
        return { ok: false, error: "Group entity not found or not accessible" };
      }
    }

    // Simulate typing before posting
    try {
      const inputPeer = await client.getInputEntity(entity as never);
      await client.invoke(
        new Api.messages.SetTyping({
          peer: inputPeer,
          action: new Api.SendMessageTypingAction(),
        })
      );
      await new Promise((r) => setTimeout(r, 2500));
    } catch {
      // Ignore typing errors (some restricted channels disallow typing indicator)
    }

    const messageText = await preparePostText(rawTemplate, opts.useAi);
    const sent = await client.sendMessage(entity as never, { message: messageText });

    return { ok: true, messageId: sent.id };
  } catch (e: unknown) {
    if (isFloodError(e)) {
      return { ok: false, error: `FLOOD_WAIT ${floodSeconds(e)}s` };
    }
    if (isPeerFlood(e)) {
      return { ok: false, error: "PEER_FLOOD (Telegram rate limit)" };
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("CHAT_ADMIN_REQUIRED") ||
      msg.includes("CHAT_SEND_PLAIN_FORBIDDEN") ||
      msg.includes("CHAT_WRITE_FORBIDDEN")
    ) {
      return { ok: false, error: "Only admins can post here (Channel or restricted group)" };
    }
    if (msg.includes("SLOWMODE_WAIT_")) {
      return { ok: false, error: `Slow mode active: ${msg}` };
    }
    if (msg.includes("USER_BANNED_IN_CHANNEL")) {
      return { ok: false, error: "Account is banned from posting in this group" };
    }
    return { ok: false, error: msg };

  } finally {
    if (!opts.clientRef && ownClient) {
      await ownClient.disconnect();
    }
  }
}
