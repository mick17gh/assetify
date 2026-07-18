import type { NextConfig } from "next";

const spacesCdnUrl = process.env.DO_SPACES_CDN_URL;
const spacesImageHost = spacesCdnUrl ? new URL(spacesCdnUrl).hostname : undefined;

const nextConfig: NextConfig = {
  env: {
    BUILD_ID:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.BUILD_ID ||
      process.env.VERCEL_DEPLOYMENT_ID ||
      `build-${Date.now()}`,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: spacesImageHost
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: spacesImageHost,
            pathname: "/**",
          },
        ],
      }
    : undefined,
};

export default nextConfig;
