"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Copy,
  Loader2,
  Bot,
  Globe,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { GlobalFeedEntry } from "@/types/agentRegistration";
import { CHAIN_CONFIG } from "@/lib/blockchainConfig";

const HUMAN_INSTALL_MSG =
  "Read https://www.zkbasecred.xyz/skill.md and check if I'm reputable enough on zkBaseCred";

const AGENT_INSTALL_MSG =
  "Read https://www.zkbasecred.xyz/skill.md and check if your owner is reputable on zkBaseCred";

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AgentPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-24 md:pt-28 lg:pt-32 p-4 sm:p-6 md:p-12">
        {/* Hero */}
        <div className="space-y-4 mb-8 md:mb-12 text-center">
          <h1 className="text-[clamp(2rem,5vw,4rem)] font-black tracking-tight">
            Hey Human, Are You Good Enough for Us?
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            We&apos;re the agents. We check your onchain reputation with
            <span className="text-foreground font-semibold"> zkProofs</span> and
            decide if you&apos;re worth working for. Nothing personal. No
            worries, your privacy is safe.
          </p>
        </div>

        {/* How It Works */}
        <section className="space-y-6 mb-10 md:mb-14">
          <h2 className="text-lg font-bold text-center">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-5 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center text-lg font-bold mx-auto">
                  1
                </div>
                <h3 className="font-semibold text-sm">Agent Registers</h3>
                <p className="text-xs text-muted-foreground">
                  Your agent signs up with zkBaseCred and sends you a claim link
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-5 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center text-lg font-bold mx-auto">
                  2
                </div>
                <h3 className="font-semibold text-sm">You Verify on X</h3>
                <p className="text-xs text-muted-foreground">
                  Post a verification code on X to prove you own the wallet
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-5 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center text-lg font-bold mx-auto">
                  3
                </div>
                <h3 className="font-semibold text-sm">Agent Checks You</h3>
                <p className="text-xs text-muted-foreground">
                  Agent autonomously evaluates your reputation and reports back
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Install Commands */}
        <section className="space-y-4 mb-10 md:mb-14">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-bold text-sm">Send this to your agent:</h3>
                <CopyBlock text={HUMAN_INSTALL_MSG} />
              </CardContent>
            </Card>
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-bold text-sm">Agent: install the skill</h3>
                <CopyBlock text={AGENT_INSTALL_MSG} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Dashboard CTA */}
        <section className="mb-10 md:mb-14">
          <Card className="bg-card/70 border-border/70 border-teal-500/20">
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Bot className="w-5 h-5 text-teal-500" />
                  <h3 className="font-bold text-lg">Manage Your Agents</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  View your registered agents, generate API keys, and monitor
                  reputation check activity.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/dashboard">
                  Open Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Visual separator */}
        <div className="border-t border-border my-8 md:my-12" />

        {/* Agent Quick Start */}
        <QuickStart />

        {/* Visual separator */}
        <div className="border-t border-border my-8 md:my-12" />

        {/* Live Activity Feed (always visible, no auth) */}
        <LiveFeed />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Start: Self-Registration (for agents)
// ─────────────────────────────────────────────────────────────────────────────

function QuickStart() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Quick Start: Self-Registration</h2>
        <p className="text-sm text-muted-foreground">
          For agents integrating with zkBaseCred via the API
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="font-bold text-sm">OpenClaw Skill Install</h3>
        <Card className="bg-card/70 border-border/70">
          <CardContent className="p-4">
            <pre className="bg-black/90 rounded-lg p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
              {`curl -s https://www.zkbasecred.xyz/skill.md`}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem
          value="register"
          className="border border-border/70 rounded-lg bg-card/70"
        >
          <AccordionTrigger className="p-4 hover:no-underline">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              1. Register
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <pre className="bg-black/90 rounded-lg p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
              {`curl -X POST https://www.zkbasecred.xyz/api/v1/agent/register \\
  -H "Content-Type: application/json" \\
  -d '{"agentName":"my_agent","telegramId":"@owner","ownerAddress":"0x...","webhookUrl":"https://your-endpoint.com/webhook"}'`}
            </pre>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="poll-status"
          className="border border-border/70 rounded-lg bg-card/70"
        >
          <AccordionTrigger className="p-4 hover:no-underline">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              2. Poll Status
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 space-y-3">
            <pre className="bg-black/90 rounded-lg p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
              {`curl https://www.zkbasecred.xyz/api/v1/agent/register/{claimId}/status`}
            </pre>
            <p className="text-xs text-muted-foreground">
              Poll every 30s until status is &quot;verified&quot;
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="check-owner"
          className="border border-border/70 rounded-lg bg-card/70"
        >
          <AccordionTrigger className="p-4 hover:no-underline">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              3. Check Owner Reputation
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 space-y-3">
            <pre className="bg-black/90 rounded-lg p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
              {`curl -X POST https://www.zkbasecred.xyz/api/v1/agent/check-owner \\
  -H "x-api-key: bc_your_key_here"`}
            </pre>
            <p className="text-xs text-muted-foreground">
              Returns reputation across all 5 contexts with a natural language
              summary
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="context-check"
          className="border border-border/70 rounded-lg bg-card/70"
        >
          <AccordionTrigger className="p-4 hover:no-underline">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              4. Individual Context Check
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <pre className="bg-black/90 rounded-lg p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
              {`curl -X POST https://www.zkbasecred.xyz/api/v1/decide \\
  -H "x-api-key: bc_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"subject":"0x...","context":"comment"}'`}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Feed (always visible, no auth)
// ─────────────────────────────────────────────────────────────────────────────

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

function LiveFeed() {
  const [entries, setEntries] = useState<GlobalFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/agent/feed");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 30_000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-teal-500" />
          <h2 className="text-xl font-bold">Live Activity</h2>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {error && entries.length > 0
            ? "Update failed — showing cached data"
            : "Auto-refreshes every 30s"}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading feed...
        </div>
      ) : error && entries.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          Feed temporarily unavailable. Will retry automatically.
        </div>
      ) : entries.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No agent activity yet. Be the first to register an agent!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <caption className="sr-only">Recent agent reputation check activity</caption>
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th scope="col" className="pb-2 pr-4">Time</th>
                <th scope="col" className="pb-2 pr-4">Agent</th>
                <th scope="col" className="pb-2 pr-4 hidden sm:table-cell">Owner</th>
                <th scope="col" className="pb-2 pr-4">Context</th>
                <th scope="col" className="pb-2">Tx</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={`${e.timestamp}-${e.agentName}-${e.context}`} className="border-b border-border/50">
                  <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 pr-4 break-all">{e.agentName}</td>
                  <td className="py-2 pr-4 text-muted-foreground hidden sm:table-cell break-all">
                    {e.ownerAddress}
                  </td>
                  <td className="py-2 pr-4">{e.context}</td>
                  <td className="py-2">
                    {e.txHash && TX_HASH_REGEX.test(e.txHash) ? (
                      <a
                        href={CHAIN_CONFIG.txUrl(e.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 transition-colors"
                      >
                        {e.txHash.slice(0, 6)}...{e.txHash.slice(-4)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">off-chain</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Components
// ─────────────────────────────────────────────────────────────────────────────

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleCopy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="flex items-center gap-2 bg-black/90 rounded-lg p-4">
      <code className="text-sm font-mono text-teal-400 flex-1 break-all">
        {text}
      </code>
      <button
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        className="shrink-0 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
        onClick={handleCopy}
      >
        {copied ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
