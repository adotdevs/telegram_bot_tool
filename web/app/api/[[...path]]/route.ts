import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const backend = (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");

function forwardHeaders(req: NextRequest): Headers {
  const h = new Headers(req.headers);
  h.delete("host");
  h.delete("connection");
  return h;
}

async function proxy(req: NextRequest, segments: string[] | undefined): Promise<NextResponse> {
  const suffix = segments?.length ? segments.join("/") : "";
  const target = `${backend}/api/${suffix}${req.nextUrl.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: forwardHeaders(req),
  };

  if (!["GET", "HEAD"].includes(req.method)) {
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(target, init);
  const buf = await res.arrayBuffer();
  const out = new NextResponse(buf, { status: res.status });
  const ct = res.headers.get("content-type");
  if (ct) out.headers.set("content-type", ct);
  return out;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
