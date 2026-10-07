import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mammoth and unpdf are only used in API routes; keep them out of the bundle.
  serverExternalPackages: ["mammoth", "unpdf"],
};

export default nextConfig;
