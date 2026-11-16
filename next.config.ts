import type { NextConfig } from "next";
import { env } from "process";

const devOrigin = env.REPLIT_DOMAINS?.split(",")[0]?.trim();
const devOrigins = ["localhost", "127.0.0.1", ...(devOrigin ? [devOrigin] : [])];

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  poweredByHeader: false,
};

export default nextConfig;
