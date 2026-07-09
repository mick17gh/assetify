import type { NextConfig } from "next";

const spacesCdnUrl = process.env.DO_SPACES_CDN_URL;
const spacesImageHost = spacesCdnUrl ? new URL(spacesCdnUrl).hostname : undefined;

const nextConfig: NextConfig = {
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
