/**
 * Empty base → relative `/api/...` (Next.js rewrite → Express). Set NEXT_PUBLIC_API_URL only if
 * the UI is hosted separately from the API with no rewrite.
 */
function apiBase(): string {
  const u = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "";
}

function tokenHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  const hasJson = json !== undefined;
  const res = await fetch(`${apiBase()}${path}`, {
    ...rest,
    headers: {
      ...(hasJson ? { "Content-Type": "application/json" } : {}),
      ...tokenHeader(),
      ...headers,
    },
    body: hasJson ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = (err as { error?: unknown }).error;
    const message =
      typeof e === "string"
        ? e
        : e !== undefined
          ? JSON.stringify(e)
          : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const h = tokenHeader() as Record<string, string>;
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: { ...h },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = (err as { error?: unknown }).error;
    const message =
      typeof e === "string"
        ? e
        : e !== undefined
          ? JSON.stringify(e)
          : res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
