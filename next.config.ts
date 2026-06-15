import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      allowedOrigins: ["aims.cipher-node.org", "api-aims.cipher-node.org", "localhost:3000"],
    },
  },
};

export default nextConfig;
