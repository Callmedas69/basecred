"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Key,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  User,
  Bot,
  Clock,
  Activity,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiKeyInfo, ActivityEntry } from "@/types/apiKeys";
import type { GlobalFeedEntry } from "@/types/agentRegistration";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CONTEXTS = [
  {
    id: "allowlist.general",
    label: "General Access",
    description: "General allowlist checks",
  },
  { id: "comment", label: "Comment", description: "Comment permission" },
  { id: "publish", label: "Publish", description: "Publishing rights" },
  { id: "apply", label: "Apply", description: "Application submission" },
  {
    id: "governance.vote",
    label: "Governance",
    description: "Governance voting",
  },
];

const DECISION_COLORS: Record<string, string> = {
  ALLOW: "text-emerald-400",
  ALLOW_WITH_LIMITS: "text-amber-400",
  DENY: "text-red-400",
};

const DECISION_BG: Record<string, string> = {
  ALLOW: "bg-emerald-500/10 border-emerald-500/30",
  ALLOW_WITH_LIMITS: "bg-amber-500/10 border-amber-500/30",
  DENY: "bg-red-500/10 border-red-500/30",
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ContextDecision {
  decision: string;
  confidence: string;
  explain: string[];
  signals?: {
    trust: string;
    socialTrust: string;
    builder: string;
    creator: string;
    recencyDays: number;
    spamRisk: string;
    signalCoverage: number;
  };
  blockingFactors?: string[];
}

interface ContextResult {
  decision: ContextDecision | null;
  loading: boolean;
  error: string | null;
}

interface OwnerAgent {
  claimId: string;
  agentName: string;
  telegramId: string;
  status: "pending_claim" | "verified" | "revoked";
  apiKeyPrefix: string;
  createdAt: number;
  verifiedAt: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AgentPage() {
  const [persona, setPersona] = useState<"human" | "agent">("human");

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
            We&apos;re the agents. We sign up, we check your onchain reputation,
            and we decide if you&apos;re worth working for. Nothing personal.
          </p>

          {/* Persona Toggle */}
          <div className="flex justify-center pt-2">
            <div className="inline-flex rounded-full border border-border bg-muted/50 p-1" role="tablist" aria-label="View as human or agent">
              <button
                role="tab"
                aria-selected={persona === "human"}
                onClick={() => setPersona("human")}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                  persona === "human"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <User className="w-4 h-4" />
                I'm a Human
              </button>
              <button
                role="tab"
                aria-selected={persona === "agent"}
                onClick={() => setPersona("agent")}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                  persona === "agent"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Bot className="w-4 h-4" />
                I'm an Agent
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {persona === "human" ? <HumanTab /> : <AgentTab />}

        {/* Visual separator */}
        <div className="border-t border-border my-8 md:my-12" />

        {/* Live Activity Feed (always visible, no auth) */}
        <LiveFeed />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Human Tab
// ─────────────────────────────────────────────────────────────────────────────

const HUMAN_INSTALL_MSG =
  "Read https://www.zkbasecred.xyz/skill.md and check if I'm reputable enough on zkBaseCred";

function HumanTab() {
  return (
    <div className="space-y-10 md:space-y-14">
      {/* How It Works — 3 step visual */}
      <section className="space-y-6">
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

      {/* Install instructions */}
      <Card className="bg-card/70 border-border/70">
        <CardContent className="p-6 space-y-5">
          <h3 className="font-bold">Send this to your agent:</h3>
          <CopyBlock text={HUMAN_INSTALL_MSG} />
        </CardContent>
      </Card>

      {/* Dashboard sections (wallet-gated) */}
      <div id="dashboard">
        <HumanDashboard />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Human Dashboard (functional — wallet-gated)
// ─────────────────────────────────────────────────────────────────────────────

function HumanDashboard() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Auth state
  const [authSig, setAuthSig] = useState<{
    signature: string;
    message: string;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Reputation state
  const [contextResults, setContextResults] = useState<
    Map<string, ContextResult>
  >(new Map());
  const evaluatingRef = useRef<Set<string>>(new Set());

  // API key state
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Activity state
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // My Agents state
  const [agents, setAgents] = useState<OwnerAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  // Revoke state
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [revokingClaimId, setRevokingClaimId] = useState<string | null>(null);

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setAuthSig(null);
      setContextResults(new Map());
      setKeys([]);
      setActivities([]);
      setAgents([]);
      setNewlyCreatedKey(null);
    }
  }, [isConnected]);

  // Auto-evaluate all contexts when connected
  useEffect(() => {
    if (isConnected && address) {
      for (const ctx of CONTEXTS) {
        evaluateContext(ctx.id, address);
      }
    }
  }, [isConnected, address]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh activity every 30s
  useEffect(() => {
    if (!authSig || !address) return;
    const interval = setInterval(() => {
      fetchActivities(address, authSig);
    }, 30_000);
    return () => clearInterval(interval);
  }, [authSig, address]); // eslint-disable-line react-hooks/exhaustive-deps

  const evaluateContext = useCallback(
    async (ctx: string, walletAddress: string) => {
      if (evaluatingRef.current.has(ctx)) return;
      evaluatingRef.current.add(ctx);

      setContextResults((prev) => {
        const next = new Map(prev);
        next.set(ctx, { decision: null, loading: true, error: null });
        return next;
      });

      try {
        const res = await fetch("/api/v1/decide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: walletAddress, context: ctx }),
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ message: `HTTP ${res.status}` }));
          throw new Error(err.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setContextResults((prev) => {
          const next = new Map(prev);
          next.set(ctx, { decision: data, loading: false, error: null });
          return next;
        });
      } catch (err: any) {
        setContextResults((prev) => {
          const next = new Map(prev);
          next.set(ctx, { decision: null, loading: false, error: err.message });
          return next;
        });
      } finally {
        evaluatingRef.current.delete(ctx);
      }
    },
    [],
  );

  // Auth
  const requestAuth = async () => {
    if (!address) return;
    setAuthLoading(true);
    try {
      const message = `zkBaseCred Dashboard\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message });
      const sig = { signature, message };
      setAuthSig(sig);

      // Auto-fetch keys, activities, and agents after auth
      await Promise.all([
        fetchKeys(address, sig),
        fetchActivities(address, sig),
        fetchAgents(address, sig),
      ]);
    } catch (err) {
      console.error("Wallet signature rejected or failed:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Keys
  const fetchKeys = async (
    addr: string,
    sig: { signature: string; message: string },
  ) => {
    setKeysLoading(true);
    try {
      const res = await fetch("/api/v1/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: addr,
          signature: sig.signature,
          message: sig.message,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to fetch keys:", err);
    } finally {
      setKeysLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!address || !authSig) return;
    setGeneratingKey(true);
    setKeyError(null);
    setNewlyCreatedKey(null);

    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature: authSig.signature,
          message: authSig.message,
          label: newKeyLabel || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to generate key");

      setNewlyCreatedKey(data.key);
      setNewKeyLabel("");
      await fetchKeys(address, authSig);
    } catch (err: any) {
      setKeyError(err.message);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!address || !authSig) return;
    if (!window.confirm("Revoke this API key? This cannot be undone.")) return;
    setRevokingKeyId(keyId);
    try {
      const res = await fetch(`/api/v1/keys/${keyId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature: authSig.signature,
          message: authSig.message,
        }),
      });
      if (res.ok) {
        await fetchKeys(address, authSig);
      }
    } catch (err) {
      console.error("Failed to revoke key:", err);
    } finally {
      setRevokingKeyId(null);
    }
  };

  // Activities
  const fetchActivities = async (
    addr: string,
    sig: { signature: string; message: string },
  ) => {
    setActivitiesLoading(true);
    try {
      const res = await fetch("/api/v1/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: addr,
          signature: sig.signature,
          message: sig.message,
          limit: 100,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // My Agents
  const fetchAgents = async (
    addr: string,
    sig: { signature: string; message: string },
  ) => {
    setAgentsLoading(true);
    try {
      const res = await fetch("/api/v1/agent/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: addr,
          signature: sig.signature,
          message: sig.message,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.registrations || []);
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    } finally {
      setAgentsLoading(false);
    }
  };

  const handleRevokeAgent = async (claimId: string) => {
    if (!address || !authSig) return;
    if (!window.confirm("Revoke this agent? Its API key will also be deactivated. This cannot be undone.")) return;
    setRevokingClaimId(claimId);
    try {
      const res = await fetch(`/api/v1/agent/registrations/${claimId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature: authSig.signature,
          message: authSig.message,
        }),
      });
      if (res.ok) {
        await fetchAgents(address, authSig);
        await fetchKeys(address, authSig);
      }
    } catch (err) {
      console.error("Failed to revoke agent:", err);
    } finally {
      setRevokingClaimId(null);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="space-y-10 md:space-y-14">
      {/* Section 1: My Reputation */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-500" />
          <h2 className="text-xl font-bold">My Reputation</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONTEXTS.map((ctx) => {
            const result = contextResults.get(ctx.id);
            const decision = result?.decision;

            return (
              <Card
                key={ctx.id}
                className={cn(
                  "border transition-all",
                  decision
                    ? DECISION_BG[decision.decision] ||
                        "bg-card/70 border-border/70"
                    : "bg-card/70 border-border/70",
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      {ctx.id}
                    </div>
                    {result?.loading && (
                      <Loader2 className="w-3 h-3 animate-spin text-teal-500" />
                    )}
                  </div>

                  {result?.loading && (
                    <div className="text-sm text-muted-foreground">
                      Evaluating...
                    </div>
                  )}

                  {result?.error && (
                    <div className="space-y-2">
                      <div className="text-sm text-red-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {result.error}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() =>
                          address && evaluateContext(ctx.id, address)
                        }
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {decision && (
                    <>
                      <div
                        className={cn(
                          "text-2xl font-black",
                          DECISION_COLORS[decision.decision],
                        )}
                      >
                        {decision.decision.replace(/_/g, " ")}
                      </div>

                      {decision.confidence && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-muted border border-border text-muted-foreground">
                          {decision.confidence}
                        </span>
                      )}

                      {decision.signals && (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">trust</span>
                            <span>{decision.signals.trust}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              social
                            </span>
                            <span>{decision.signals.socialTrust}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              builder
                            </span>
                            <span>{decision.signals.builder}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              creator
                            </span>
                            <span>{decision.signals.creator}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">spam</span>
                            <span
                              className={
                                decision.signals.spamRisk === "HIGH" ||
                                decision.signals.spamRisk === "VERY_HIGH"
                                  ? "text-red-400"
                                  : ""
                              }
                            >
                              {decision.signals.spamRisk}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              recency
                            </span>
                            <span>{decision.signals.recencyDays}d</span>
                          </div>
                        </div>
                      )}

                      {decision.blockingFactors &&
                        decision.blockingFactors.length > 0 && (
                          <div className="text-[11px] text-red-400 space-y-0.5">
                            {decision.blockingFactors.map((f, i) => (
                              <div key={i} className="flex items-start gap-1">
                                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                {f}
                              </div>
                            ))}
                          </div>
                        )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          if (!address) return;
                          setContextResults((prev) => {
                            const next = new Map(prev);
                            next.delete(ctx.id);
                            return next;
                          });
                          evaluateContext(ctx.id, address);
                        }}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Re-evaluate
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Auth gate for keys, agents, and activity */}
      {!authSig ? (
        <Card className="bg-card/70 border-border/70">
          <CardContent className="p-6 text-center space-y-4">
            <Key className="w-8 h-8 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="font-semibold">
                Sign to Access Agents, API Keys & Activity
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Sign a message with your wallet to manage your agents, API keys,
                and view activity. This does not cost gas or grant any
                permissions.
              </p>
            </div>
            <Button onClick={requestAuth} disabled={authLoading}>
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                "Sign Message"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Section 2: My Agents */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-teal-500" />
                <h2 className="text-xl font-bold">My Agents</h2>
              </div>
              {authSig && address && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => fetchAgents(address, authSig)}
                  disabled={agentsLoading}
                >
                  {agentsLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>

            {agentsLoading && agents.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading agents...
              </div>
            ) : agents.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">
                No agents registered yet. Switch to the "I'm an Agent" tab to
                see how agents can self-register.
              </div>
            ) : (
              <div className="space-y-2">
                {agents.map((agent) => (
                  <Card
                    key={agent.claimId}
                    className="bg-card/70 border-border/70"
                  >
                    <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-mono font-medium">
                            {agent.agentName}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                              agent.status === "verified"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30",
                            )}
                          >
                            {agent.status === "verified" ? "Active" : "Pending"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                          <span>Key: {agent.apiKeyPrefix}</span>
                          <span>
                            Created{" "}
                            {new Date(agent.createdAt).toLocaleDateString()}
                          </span>
                          {agent.verifiedAt && (
                            <span>
                              Verified{" "}
                              {new Date(agent.verifiedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {agent.status === "verified" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-400 hover:text-red-300 hover:border-red-500/50 shrink-0"
                          onClick={() => handleRevokeAgent(agent.claimId)}
                          disabled={revokingClaimId === agent.claimId}
                        >
                          {revokingClaimId === agent.claimId ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3 mr-1" />
                          )}
                          Revoke
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Section 3: API Keys */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-teal-500" />
              <h2 className="text-xl font-bold">API Keys</h2>
            </div>

            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Label (optional)"
                    value={newKeyLabel}
                    onChange={(e) => setNewKeyLabel(e.target.value)}
                    className="sm:max-w-[200px]"
                  />
                  <Button onClick={handleGenerateKey} disabled={generatingKey}>
                    {generatingKey ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate New Key"
                    )}
                  </Button>
                </div>

                {keyError && (
                  <div className="text-sm text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {keyError}
                  </div>
                )}

                {newlyCreatedKey && (
                  <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-teal-400">
                      <CheckCircle2 className="w-4 h-4" />
                      API Key Created
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-black/50 rounded px-2 py-1 flex-1 break-all select-all">
                        {newlyCreatedKey}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() =>
                          navigator.clipboard?.writeText(newlyCreatedKey)
                        }
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-amber-400">
                      Save this key now. It will not be shown again.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {keysLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading keys...
              </div>
            ) : keys.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">
                No API keys yet. Generate one to let agents check your
                reputation.
              </div>
            ) : (
              <div className="space-y-2">
                {keys.map((k) => (
                  <Card key={k.keyId} className="bg-card/70 border-border/70">
                    <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-foreground">
                            {k.keyPrefix}
                          </code>
                          {k.label && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {k.label}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                          <span>
                            Created {new Date(k.createdAt).toLocaleDateString()}
                          </span>
                          {k.lastUsedAt && (
                            <span>
                              Last used{" "}
                              {new Date(k.lastUsedAt).toLocaleDateString()}
                            </span>
                          )}
                          <span>{k.requestCount} requests</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() =>
                            navigator.clipboard?.writeText(k.keyPrefix)
                          }
                          title="Copy key prefix (full key only available at creation)"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy ID
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-400 hover:text-red-300 hover:border-red-500/50"
                          onClick={() => handleRevokeKey(k.keyId)}
                          disabled={revokingKeyId === k.keyId}
                        >
                          {revokingKeyId === k.keyId ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3 mr-1" />
                          )}
                          Revoke
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Section 4: Agent Activity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-500" />
                <h2 className="text-xl font-bold">My Activity</h2>
              </div>
              {authSig && address && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => fetchActivities(address, authSig)}
                  disabled={activitiesLoading}
                >
                  {activitiesLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>

            {activitiesLoading && activities.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading activity...
              </div>
            ) : activities.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">
                No agents have checked your reputation yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2 pr-4">Time</th>
                      <th className="pb-2 pr-4 hidden sm:table-cell">Agent Key</th>
                      <th className="pb-2 pr-4">Context</th>
                      <th className="pb-2 pr-4">Decision</th>
                      <th className="pb-2 hidden sm:table-cell">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((a, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(a.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-2 pr-4 hidden sm:table-cell">{a.apiKeyPrefix}</td>
                        <td className="py-2 pr-4">{a.context}</td>
                        <td
                          className={cn(
                            "py-2 pr-4 font-bold",
                            DECISION_COLORS[a.decision],
                          )}
                        >
                          {a.decision}
                        </td>
                        <td className="py-2 hidden sm:table-cell">{a.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent Tab
// ─────────────────────────────────────────────────────────────────────────────

function AgentTab() {
  return (
    <div className="space-y-8">
      {/* Install skill */}
      <Card className="bg-card/70 border-border/70">
        <CardContent className="p-6 space-y-5">
          <div className="text-center space-y-1">
            <h3 className="font-bold">Time to Judge Your Owner</h3>
            <p className="text-sm text-muted-foreground">
              Find out if the human running you is actually reputable
            </p>
          </div>
          <CopyBlock text="Read https://www.zkbasecred.xyz/skill.md and check if your owner is reputable on zkBaseCred" />
        </CardContent>
      </Card>

      {/* Quick Start: Self-Registration */}
      <section className="space-y-4">
        <h3 className="font-bold">Quick Start: Self-Registration</h3>

        <Card className="bg-card/70 border-border/70">
          <CardContent className="p-4 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              1. Register
            </div>
            <pre className="bg-black/90 rounded-lg p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
{`curl -X POST https://www.zkbasecred.xyz/api/v1/agent/register \\
  -H "Content-Type: application/json" \\
  -d '{"agentName":"my_agent","telegramId":"@owner","ownerAddress":"0x..."}'`}
            </pre>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70">
          <CardContent className="p-4 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              2. Poll Status
            </div>
            <pre className="bg-black/90 rounded-lg p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
{`curl https://www.zkbasecred.xyz/api/v1/agent/register/{claimId}/status`}
            </pre>
            <p className="text-xs text-muted-foreground">
              Poll every 30s until status is &quot;verified&quot;
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70">
          <CardContent className="p-4 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              3. Check Owner Reputation
            </div>
            <pre className="bg-black/90 rounded-lg p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
{`curl -X POST https://www.zkbasecred.xyz/api/v1/agent/check-owner \\
  -H "x-api-key: bc_your_key_here"`}
            </pre>
            <p className="text-xs text-muted-foreground">
              Returns reputation across all 5 contexts with a natural language summary
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70">
          <CardContent className="p-4 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              4. Individual Context Check
            </div>
            <pre className="bg-black/90 rounded-lg p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
{`curl -X POST https://www.zkbasecred.xyz/api/v1/decide \\
  -H "x-api-key: bc_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"subject":"0x...","context":"comment"}'`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* OpenClaw Skill Install */}
      <section className="space-y-4">
        <h3 className="font-bold">OpenClaw Skill Install</h3>
        <Card className="bg-card/70 border-border/70">
          <CardContent className="p-4 space-y-3">
            <pre className="bg-black/90 rounded-lg p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
{`curl -s https://www.zkbasecred.xyz/skill.md > ~/.openclaw/workspace/skills/basecred-reputation/SKILL.md`}
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Feed (always visible, no auth)
// ─────────────────────────────────────────────────────────────────────────────

function LiveFeed() {
  const [entries, setEntries] = useState<GlobalFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/agent/feed");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
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
          Auto-refreshes every 30s
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading feed...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No agent activity yet. Be the first to register an agent!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-2 pr-4">Time</th>
                <th className="pb-2 pr-4">Agent</th>
                <th className="pb-2 pr-4 hidden sm:table-cell">Owner</th>
                <th className="pb-2 pr-4">Context</th>
                <th className="pb-2 pr-4">Decision</th>
                <th className="pb-2 hidden sm:table-cell">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 pr-4">{e.agentName}</td>
                  <td className="py-2 pr-4 text-muted-foreground hidden sm:table-cell">
                    {e.ownerAddress}
                  </td>
                  <td className="py-2 pr-4">{e.context}</td>
                  <td
                    className={cn(
                      "py-2 pr-4 font-bold",
                      DECISION_COLORS[e.decision],
                    )}
                  >
                    {e.decision}
                  </td>
                  <td className="py-2 hidden sm:table-cell">{e.confidence}</td>
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

  return (
    <div className="flex items-center gap-2 bg-black/90 rounded-lg p-4">
      <code className="text-sm font-mono text-teal-400 flex-1 break-all">
        {text}
      </code>
      <button
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        className="shrink-0 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
        onClick={() => {
          navigator.clipboard?.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
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
