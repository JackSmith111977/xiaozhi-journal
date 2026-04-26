import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // Source Maps 上传: Vercel 添加 SENTRY_AUTH_TOKEN 后自动启用
});
