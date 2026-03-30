import type { NextConfig } from "next";

/** /api/* is handled by `app/api/[[...path]]/route.ts` (forwards Authorization & body to Express). */
const nextConfig: NextConfig = {};

export default nextConfig;
