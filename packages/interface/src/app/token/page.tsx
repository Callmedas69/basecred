"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Copy,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { CHAIN_CONFIG } from "@/lib/blockchainConfig";

// =============================================================================
// Constants
// =============================================================================

const ZKB_TOKEN_ADDRESS = "0x1758b8d8ac471605772084af534438c781113ba3";

const UNISWAP_WIDGET_URL = `https://app.uniswap.org/#/swap?outputCurrency=${ZKB_TOKEN_ADDRESS}&chain=base`;

const DOPPLER_URL = `https://app.doppler.lol/tokens/base/${ZKB_TOKEN_ADDRESS}`;

const GECKOTERM_URL = `https://www.geckoterminal.com/base/pools/${ZKB_TOKEN_ADDRESS}`;

const TOKEN_DETAILS = [
  { label: "NAME", value: "ZKBASECRED" },
  { label: "TICKER", value: "$ZKB" },
  { label: "CHAIN", value: "Base (Ethereum L2)" },
  { label: "TOTAL SUPPLY", value: "100,000,000,000" },
  { label: "DEX", value: "Uniswap V4 (Doppler)" },
  { label: "SWAP FEE", value: "1.2% per trade" },
] as const;

const FEE_RECIPIENTS = [
  { recipient: "zkBasecred Ecosystem", share: "57%" },
  { recipient: "Bankr", share: "36.1%" },
  { recipient: "Bankr Ecosystem", share: "1.9%" },
  { recipient: "Protocol (Doppler)", share: "5%" },
] as const;

// =============================================================================
// Types
// =============================================================================

interface TokenMarketData {
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  liquidity: number | null;
  txns24h: number;
  pairAddress: string;
  dexId: string;
  lastUpdated: string;
}

// =============================================================================
// Helpers
// =============================================================================

function formatPrice(value: number | null): string {
  if (value === null) return "—";
  if (value >= 0.01) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  // Subscript notation for tiny prices: $0.0₇21
  const str = value.toFixed(20);
  const match = str.match(/^0\.(0+)(\d{2,4})/);
  if (match) {
    const zeroCount = match[1].length;
    const significand = match[2].replace(/0+$/, "");
    const subscriptDigits = "₀₁₂₃₄₅₆₇₈₉";
    const sub = String(zeroCount)
      .split("")
      .map((d) => subscriptDigits[parseInt(d)])
      .join("");
    return `$0.0${sub}${significand}`;
  }
  return `$${value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "")}`;
}

function formatUsd(value: number | null): string {
  if (value === null) return "—";
  return `$${Math.round(value).toLocaleString()}`;
}

function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString();
}

// =============================================================================
// Page
// =============================================================================

export default function TokenPage() {
  const [copied, setCopied] = useState(false);
  const [marketData, setMarketData] = useState<TokenMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMarketData() {
      try {
        const res = await fetch("/api/v1/token-market");
        if (!res.ok) {
          throw new Error(`Failed to fetch market data (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) {
          setMarketData(json.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load market data",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMarketData();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleCopy() {
    navigator.clipboard?.writeText(ZKB_TOKEN_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const priceStr = marketData ? formatPrice(marketData.price) : "";
  const stats = marketData
    ? [
        { label: "MARKET CAP", value: formatUsd(marketData.marketCap) },
        { label: "24H VOLUME", value: formatUsd(marketData.volume24h) },
        { label: "LIQUIDITY", value: formatUsd(marketData.liquidity) },
        {
          label: "24H TXNS",
          value: formatNumber(marketData.txns24h),
          accent: true,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-24 md:pt-28 lg:pt-32 p-4 sm:p-6 md:p-12">
        {/* Header */}
        <div className="space-y-3 mb-8 md:mb-12 text-center">
          <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-black tracking-tight bg-linear-to-r from-teal-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">
            $ZKB
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Prove trust. Preserve privacy.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading market data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-2 py-12 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Price — hero stat, always full width */}
              <Card className="bg-card/70 border-border/70">
                <CardContent className="p-4 sm:p-5 text-center">
                  <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    PRICE
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums text-teal-500">
                    {priceStr}
                  </p>
                </CardContent>
              </Card>

              {/* Other stats — 2x2 on mobile, 4-across on desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats.map((stat) => (
                  <Card
                    key={stat.label}
                    className="bg-card/70 border-border/70"
                  >
                    <CardContent className="p-4 sm:p-5 text-center">
                      <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p
                        className={`text-base sm:text-2xl font-bold tabular-nums ${
                          stat.accent ? "text-teal-500" : "text-foreground"
                        }`}
                      >
                        {stat.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contract Address */}
        <Card className="bg-card/70 border-border/70 mb-8 md:mb-12">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Contract Address (Base)
                </p>
                <p className="text-sm sm:text-base font-mono text-teal-500 break-all">
                  {ZKB_TOKEN_ADDRESS}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-border bg-background/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors"
                aria-label={copied ? "Copied" : "Copy contract address"}
              >
                {copied ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                    Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </span>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Buy $ZKB */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-black tracking-tight mb-4 md:mb-6">
            Buy <span className="text-teal-500">$ZKB</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Swap Card */}
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">Uniswap</h3>
                  <p className="text-sm text-muted-foreground">
                    Swap ETH &rarr; $ZKB directly on Base via Uniswap.
                  </p>
                </div>
                <a
                  href={UNISWAP_WIDGET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all"
                >
                  Swap on Uniswap
                  <ExternalLink className="w-4 h-4" />
                </a>
              </CardContent>
            </Card>

            {/* Doppler Card */}
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">Doppler</h3>
                  <p className="text-sm text-muted-foreground">
                    View the pool, chart, and trade on Doppler.
                  </p>
                </div>
                <a
                  href={DOPPLER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all"
                >
                  View on Doppler
                  <ExternalLink className="w-4 h-4" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Token Details */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-black tracking-tight mb-4 md:mb-6">
            Token <span className="text-teal-500">Details</span>
          </h2>

          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {TOKEN_DETAILS.map((detail) => (
              <Card key={detail.label} className="bg-card/70 border-border/70">
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    {detail.label}
                  </p>
                  <p className="text-base sm:text-lg font-semibold">
                    {detail.value}
                  </p>
                </CardContent>
              </Card>
            ))}

            {/* Basescan Link */}
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-4 sm:p-5">
                <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  BASESCAN
                </p>
                <a
                  href={CHAIN_CONFIG.addressUrl(ZKB_TOKEN_ADDRESS)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base sm:text-lg font-semibold text-teal-500 hover:text-teal-600 transition-colors inline-flex items-center gap-1"
                >
                  View on Basescan &rarr;
                </a>
              </CardContent>
            </Card>

            {/* Chart Link */}
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-4 sm:p-5">
                <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  CHART
                </p>
                <a
                  href={GECKOTERM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base sm:text-lg font-semibold text-teal-500 hover:text-teal-600 transition-colors inline-flex items-center gap-1"
                >
                  GeckoTerminal &rarr;
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="mb-8 md:mb-16">
          <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-black tracking-tight mb-2 md:mb-3">
            Fee <span className="text-teal-500">Structure</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-4 md:mb-6">
            Every trade generates a 1.2% swap fee, split automatically:
          </p>

          <Card className="bg-card/70 border-border/70 overflow-hidden">
            <CardContent className="p-0">
              {/* Table header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border/50 bg-muted/30">
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Recipient
                </span>
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Share
                </span>
              </div>
              {/* Table rows */}
              {FEE_RECIPIENTS.map((fee, i) => (
                <div
                  key={fee.recipient}
                  className={`flex items-center justify-between px-4 sm:px-5 py-3.5 ${
                    i < FEE_RECIPIENTS.length - 1
                      ? "border-b border-border/30"
                      : ""
                  }`}
                >
                  <span className="text-sm sm:text-base font-medium">
                    {fee.recipient}
                  </span>
                  <span className="text-sm sm:text-base font-bold tabular-nums text-teal-500">
                    {fee.share}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
