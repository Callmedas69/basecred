"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  Terminal,
  Shield,
  Users,
  Hammer,
  Zap,
  Search,
  LayoutDashboard,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CONTEXT_DESCRIPTIONS: Record<string, string> = {
  default: "Standard Policy Analysis",
  "allowlist.general": "General Access Allowlist",
  comment: "Comment Permission",
  publish: "Publishing Rights",
  apply: "Application Submission",
  "governance.vote": "Governance Voting",
};

export default function ExplorerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<any>(null); // Consider typing this better if possible
  const [error, setError] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<string>("");
  const [contexts, setContexts] = useState<string[]>([]);

  // Fetch available contexts on mount
  useEffect(() => {
    const fetchContexts = async () => {
      try {
        const res = await fetch("/api/v1/contexts");
        if (res.ok) {
          const data = await res.json();
          setContexts(data.contexts || []);
          if (data.contexts?.length > 0) setSelectedContext(data.contexts[0]);
        }
      } catch (err) {
        console.error("Failed to fetch contexts", err);
      }
    };
    fetchContexts();
  }, []);

  const handleSearch = async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Fetch all decisions in parallel
      // We use the 'contexts' state we fetched earlier
      const contextsToRun = contexts.length > 0 ? contexts : ["default"];

      const promises = contextsToRun.map((ctx) =>
        fetch("/api/v1/decide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: address, context: ctx }),
        })
          .then(async (r) => {
            if (!r.ok) throw new Error("Failed to fetch");
            const data = await r.json();
            return { ...data, context: ctx }; // Inject context back for UI mapping
          })
          .catch((e) => ({
            context: ctx,
            error: e.message || "Failed to fetch",
          })),
      );

      const results = await Promise.all(promises);

      // 2. Aggregate results for the UI
      // The UI expects a structure roughly like: { results: [], signals: ..., profile: ... }
      // We'll take the profile/signals from the first successful response as they should be identical
      const validResult = results.find((r) => !r.error && r.profile);

      if (!validResult) {
        // If every single one failed
        const firstError = results[0]?.error || "Unknown error";
        throw new Error(
          typeof firstError === "string"
            ? firstError
            : JSON.stringify(firstError),
        );
      }

      setResult({
        results: results
          .filter((r) => !r.error)
          .sort((a, b) => a.context.localeCompare(b.context)),
        signals: validResult.signals,
        profile: validResult.profile,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch decisions");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get current decision based on selected context
  const currentDecision = result?.results?.find(
    (r: any) => r.context === selectedContext,
  );

  // Helper to humanize signal text (e.g. VERY_HIGH -> Very High)
  const formatSignal = (val: string | undefined) => {
    if (!val) return "N/A";
    return val
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30">
      <Navbar />
      <div className="max-w-5xl mx-auto space-y-12 pt-24 md:pt-32 p-6 md:p-12">
        {/* Header */}
        <div className="space-y-4 text-center md:text-left">
          <div>
            <h1 className="text-[6rem] md:text-[8rem] font-black tracking-tighter leading-[0.8] text-foreground mb-6 select-none uppercase">
              Explorer
            </h1>
          </div>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl leading-relaxed pl-2 border-l-4 border-teal-500">
            See how a wallet is evaluated in different scenarios.
          </p>
        </div>

        {/* Search Input */}
        <div className="flex flex-col md:flex-row gap-4 max-w-2xl items-center md:items-stretch">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-lg font-mono focus-visible:ring-teal-500/50 transition-all shadow-xl"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="h-10 md:h-12 bg-foreground text-background hover:bg-foreground/90 font-bold px-6 md:px-8 shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </div>
            ) : (
              "Analyze Wallet"
            )}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl text-red-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!result && !isLoading && !error && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 py-12 md:py-24 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/10">
            <div className="max-w-md mx-auto space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-muted-foreground">
                  No wallet loaded
                </h2>
                <p className="text-muted-foreground/80 leading-relaxed">
                  Enter a wallet address above to view its normalized signals,
                  decision context, and audit reasons.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
                    handleSearch();
                  }}
                >
                  Try Example Wallet
                </Button>
                <Link href="http://localhost:4000" target="_blank">
                  <Button variant="ghost">What is this data?</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="grid md:grid-cols-3 gap-6">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          </div>
        )}

        {/* Results */}
        {result && !isLoading && currentDecision && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
            {/* Decision Card */}
            <div
              className={cn(
                "relative overflow-hidden rounded-[2rem] border transition-all duration-500",
                currentDecision.decision === "ALLOW"
                  ? "border-emerald-500/50 bg-emerald-950/10 shadow-[0_0_60px_-15px_rgba(16,185,129,0.4)]"
                  : currentDecision.decision === "DENY"
                    ? "border-red-500/50 bg-red-950/10 shadow-[0_0_60px_-15px_rgba(239,68,68,0.4)]"
                    : "border-yellow-500/50 bg-yellow-950/10 shadow-[0_0_60px_-15px_rgba(234,179,8,0.4)]",
              )}
            >
              <div className="relative z-10 p-8 md:p-12">
                <div className="space-y-4">
                  <div className="font-mono text-sm tracking-widest text-[#888] flex items-center gap-2">
                    <span className="opacity-50">&gt;_</span> POLICY OUTCOME
                  </div>
                  <div
                    className={cn(
                      "text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter uppercase break-all leading-[0.85]",
                      currentDecision.decision === "ALLOW"
                        ? "text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                        : currentDecision.decision === "DENY"
                          ? "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                          : "text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]",
                    )}
                  >
                    {currentDecision.decision.replace(/_/g, " ")}
                  </div>
                  <div className="text-muted-foreground/60 font-mono text-sm md:text-base max-w-2xl leading-relaxed">
                    {currentDecision.explain.join(". ")}
                  </div>
                </div>
              </div>

              {/* Glow Mesh */}
              <div
                className={cn(
                  "absolute inset-0 opacity-20 pointer-events-none mix-blend-screen",
                  currentDecision.decision === "ALLOW"
                    ? "bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.4),transparent_60%)]"
                    : currentDecision.decision === "DENY"
                      ? "bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.4),transparent_60%)]"
                      : "bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.4),transparent_60%)]",
                )}
              />
            </div>

            {/* Context Tabs */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wider whitespace-nowrap mr-4">
                <LayoutDashboard className="w-4 h-4" />
                <span>Scenario:</span>
              </div>
              <div className="flex gap-2">
                {result.results.map((r: any) => (
                  <button
                    key={r.context}
                    onClick={() => setSelectedContext(r.context)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border whitespace-nowrap",
                      selectedContext === r.context
                        ? "bg-foreground text-background border-foreground shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {r.context}
                    <span
                      className={cn(
                        "ml-2 w-2 h-2 rounded-full inline-block",
                        r.decision === "ALLOW"
                          ? "bg-emerald-500"
                          : r.decision === "DENY"
                            ? "bg-red-500"
                            : "bg-yellow-500",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet Summary */}
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-md border border-border text-sm font-mono text-foreground font-bold uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  TRUST: {formatSignal(result.signals?.trust)}
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-md border border-border text-sm font-mono font-bold uppercase tracking-wider",
                    result.signals?.spamRisk === "HIGH"
                      ? "text-red-500"
                      : "text-foreground",
                  )}
                >
                  <AlertCircle className="w-4 h-4" />
                  SPAM: {formatSignal(result.signals?.spamRisk)}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-md border border-border text-sm font-mono text-foreground font-bold uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-blue-500" />
                  COVERAGE: 100%
                </div>
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl">
                This wallet shows{" "}
                <span className="text-foreground font-medium">
                  {formatSignal(result.signals?.trust).toLowerCase()}
                </span>{" "}
                trust signals with{" "}
                <span className="text-foreground font-medium">
                  {formatSignal(result.signals?.spamRisk).toLowerCase()}
                </span>{" "}
                spam indicators, based on available on-chain and social data.
              </p>
            </div>

            <Tabs defaultValue="structured" className="w-full">
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <TabsList className="bg-transparent border-none p-0 h-auto gap-8">
                  <TabsTrigger
                    value="structured"
                    className="bg-transparent border-none p-0 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-none rounded-none text-lg transition-colors hover:text-foreground"
                  >
                    Signals
                  </TabsTrigger>
                  <TabsTrigger
                    value="json"
                    className="bg-transparent border-none p-0 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-none rounded-none text-lg transition-colors hover:text-foreground"
                  >
                    JSON
                  </TabsTrigger>
                </TabsList>
                <div className="text-xs text-muted-foreground font-mono hidden md:block">
                  ver {result.version}
                </div>
              </div>

              <TabsContent value="structured" className="space-y-12">
                {/* Structured Data View */}
                <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 font-mono text-sm md:text-base border-t border-border pt-4">
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <span className="text-muted-foreground">trust</span>
                    <span className="font-bold text-foreground">
                      {formatSignal(result.signals?.trust)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <span className="text-muted-foreground">socialTrust</span>
                    <span className="font-bold text-foreground">
                      {formatSignal(result.signals?.socialTrust)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <span className="text-muted-foreground">builder</span>
                    <span className="font-bold text-foreground">
                      {formatSignal(result.signals?.builder)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <span className="text-muted-foreground">spamRisk</span>
                    <span
                      className={cn(
                        "font-bold",
                        result.signals?.spamRisk === "HIGH"
                          ? "text-red-500"
                          : "text-foreground",
                      )}
                    >
                      {formatSignal(result.signals?.spamRisk)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <span className="text-muted-foreground">context</span>
                    <div className="text-right">
                      <span className="font-bold text-foreground block">
                        {selectedContext}
                      </span>
                      {CONTEXT_DESCRIPTIONS[selectedContext] && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {CONTEXT_DESCRIPTIONS[selectedContext]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <span className="text-muted-foreground">decision</span>
                    <span
                      className={cn(
                        "font-bold",
                        currentDecision.decision === "ALLOW"
                          ? "text-emerald-500"
                          : "text-yellow-500",
                      )}
                    >
                      {currentDecision.decision}
                    </span>
                  </div>
                </div>

                {/* Sources & Reasons */}
                <div className="space-y-4 pt-4">
                  <h3 className="font-mono text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Sources & Reasons
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-6 space-y-2 border border-border">
                    {currentDecision.explain.map(
                      (reason: string, i: number) => (
                        <div
                          key={i}
                          className="flex gap-3 text-muted-foreground"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 sm:mt-2.5 shrink-0 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                          <span className="font-mono text-sm">{reason}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* JSON View */}
              <TabsContent value="json">
                <Card className="bg-black/90 border-border shadow-2xl">
                  <CardContent className="p-0">
                    <pre className="p-6 overflow-auto text-xs md:text-sm font-mono text-zinc-300 max-h-[600px] leading-relaxed">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
