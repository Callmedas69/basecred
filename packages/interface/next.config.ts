import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['basecred-decision-engine'],
  serverExternalPackages: ['snarkjs'],
  outputFileTracingIncludes: {
    '/api/*': ['./circuits/**/*'],
  },
};

export default nextConfig;
