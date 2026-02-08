import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { baseSepolia, base } from "wagmi/chains"

export const wagmiConfig = getDefaultConfig({
    appName: "BaseCred",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
    chains: [baseSepolia, base],
    ssr: true,
})
