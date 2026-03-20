import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['basecred-decision-engine'],
  serverExternalPackages: ['snarkjs'],
  outputFileTracingIncludes: {
    '/api/*': ['./circuits/**/*'],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.alchemy.com https://*.upstash.io https://mainnet.base.org https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org https://api.etherscan.io; img-src 'self' data: blob: https:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
        ],
      },
    ]
  },
};

export default nextConfig;
