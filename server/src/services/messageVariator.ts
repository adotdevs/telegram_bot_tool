import { getRuntimeSettings } from "./runtimeSettings.js";

const SYNONYMS: Record<string, string[]> = {
  hey: ["Hi", "Hey", "Hello", "Yo"],
  interesting: ["interesting", "exciting", "worth checking out", "pretty cool"],
  building: ["building", "working on", "shipping", "creating"],
  something: ["something", "a project", "a product"],
  team: ["team", "crew", "group"],
  check: ["check out", "take a look at", "peek at"],
  love: ["would love", "would be great", "happy"],
  hear: ["hear your thoughts", "get your take", "know what you think"],
};

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Light template rewriter: swap common words when they appear as whole tokens */
export function synonymizeTemplate(template: string): string {
  let out = template;
  for (const [word, alts] of Object.entries(SYNONYMS)) {
    const re = new RegExp(`\\b${word}\\b`, "gi");
    if (re.test(out)) {
      out = out.replace(re, pick(alts));
    }
  }
  return out;
}

/** Simple structural variants: optional greeting prefix / closing */
export function varyStructure(text: string): string {
  const openers = ["", "Quick note — ", "Hope you're well. ", ""];
  const closers = ["", " Thanks!", " Let me know.", ""];
  if (Math.random() < 0.4) {
    return `${pick(openers)}${text.trim()}${pick(closers)}`;
  }
  return text.trim();
}

export function applyTemplateVars(template: string, vars: Record<string, string>): string {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

export async function maybeAiVary(
  baseText: string,
  useAi: boolean
): Promise<string> {
  const cfg = await getRuntimeSettings();
  if (!useAi || !cfg.openaiApiKey) return baseText;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.openaiModel,
        temperature: 0.9,
        messages: [
          {
            role: "system",
            content:
              "Rewrite ONE short DM in a natural human tone. Same intent and meaning. No markdown. Max 2 sentences.",
          },
          { role: "user", content: baseText },
        ],
      }),
    });
    if (!res.ok) return baseText;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const alt = data.choices?.[0]?.message?.content?.trim();
    return alt && alt.length > 0 ? alt : baseText;
  } catch {
    return baseText;
  }
}

export function buildMessageText(
  template: string,
  vars: Record<string, string>,
  useAi: boolean
): Promise<string> {
  const withVars = applyTemplateVars(template, vars);
  const syn = synonymizeTemplate(withVars);
  const struct = varyStructure(syn);
  return maybeAiVary(struct, useAi);
}
