import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['basecred-decision-engine'],
  serverExternalPackages: ['snarkjs'],
};

export default nextConfig;
