"use client";

import { useState, useEffect, useRef } from "react";
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
  Trash2,
  Bot,
  Clock,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiKeyInfo, ActivityEntry } from "@/types/apiKeys";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DECISION_COLORS: Record<string, string> = {
  ALLOW: "text-emerald-400",
  ALLOW_WITH_LIMITS: "text-amber-400",
  DENY: "text-red-400",
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OwnerAgent {
  claimId: string;
  agentName: string;
  telegramId: string;
  webhookUrl: string | null;
  status: "pending_claim" | "verified" | "revoked";
  apiKeyPrefix: string;
  createdAt: number;
  verifiedAt: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-24 md:pt-28 lg:pt-32 p-4 sm:p-6 md:p-12">
        <div className="space-y-2 mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your agents, API keys, and view activity
          </p>
        </div>

        <Dashboard />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard (wallet-gated: My Agents, API Keys, My Activity)
// ─────────────────────────────────────────────────────────────────────────────

function Dashboard() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Auth state
  const [authSig, setAuthSig] = useState<{
    signature: string;
    message: string;
  } | null>(null);
  const authSigRef = useRef(authSig);
  useEffect(() => { authSigRef.current = authSig; }, [authSig]);
  const [authLoading, setAuthLoading] = useState(false);

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

  // Dashboard-level error
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setAuthSig(null);
      setKeys([]);
      setActivities([]);
      setAgents([]);
      setNewlyCreatedKey(null);
    }
  }, [isConnected]);

  // Auto-refresh activity every 30s
  useEffect(() => {
    if (!authSig || !address) return;
    const interval = setInterval(() => {
      const sig = authSigRef.current;
      if (sig) fetchActivities(address, sig);
    }, 30_000);
    return () => clearInterval(interval);
  }, [authSig, address]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (res.status === 401) { setAuthSig(null); return; }
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      } else {
        console.error(`Failed to fetch keys: ${res.status}`);
        setDashboardError(`Failed to load API keys (${res.status}). Please retry.`);
      }
    } catch (err) {
      console.error("Failed to fetch keys:", err);
      setDashboardError("Failed to load API keys. Please check your connection.");
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to generate key (${res.status})`);
      }

      const data = await res.json();
      setNewlyCreatedKey(data.key);
      setNewKeyLabel("");
      await fetchKeys(address, authSig);
    } catch (err: unknown) {
      setKeyError(err instanceof Error ? err.message : "Failed to generate key");
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
      } else {
        const data = await res.json().catch(() => ({}));
        setDashboardError(data.message || `Failed to revoke key (${res.status})`);
      }
    } catch (err) {
      console.error("Failed to revoke key:", err);
      setDashboardError("Failed to revoke key. Please check your connection.");
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
      if (res.status === 401) { setAuthSig(null); return; }
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      } else {
        console.error(`Failed to fetch activities: ${res.status}`);
        setDashboardError(`Failed to load activity (${res.status}). Please retry.`);
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setDashboardError("Failed to load activity. Please check your connection.");
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
      if (res.status === 401) { setAuthSig(null); return; }
      if (res.ok) {
        const data = await res.json();
        setAgents(data.registrations || []);
      } else {
        console.error(`Failed to fetch agents: ${res.status}`);
        setDashboardError(`Failed to load agents (${res.status}). Please retry.`);
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
      setDashboardError("Failed to load agents. Please check your connection.");
    } finally {
      setAgentsLoading(false);
    }
  };

  const handleRevokeAgent = async (claimId: string) => {
    if (!address || !authSig) return;
    if (
      !window.confirm(
        "Revoke this agent? Its API key will also be deactivated. This cannot be undone.",
      )
    )
      return;
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
      } else {
        const data = await res.json().catch(() => ({}));
        setDashboardError(data.message || `Failed to revoke agent (${res.status})`);
      }
    } catch (err) {
      console.error("Failed to revoke agent:", err);
      setDashboardError("Failed to revoke agent. Please check your connection.");
    } finally {
      setRevokingClaimId(null);
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-card/70 border-border/70">
        <CardContent className="p-6 text-center space-y-4">
          <Key className="w-8 h-8 mx-auto text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="font-semibold">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Connect your wallet to manage your agents, API keys, and view
              activity.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10 md:space-y-14">
      {/* Auth gate for agents, keys, and activity */}
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
          {/* Dashboard error banner */}
          {dashboardError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">{dashboardError}</span>
              <button
                className="shrink-0 text-xs underline hover:text-red-300"
                onClick={() => setDashboardError(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Section 1: My Agents */}
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
                  aria-label="Refresh agents"
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
                No agents registered yet. See the Quick Start section on the
                Agent page to learn how agents can self-register.
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
                                : agent.status === "revoked"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30",
                            )}
                          >
                            {agent.status === "verified" ? "Active" : agent.status === "revoked" ? "Revoked" : "Pending"}
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
                          {agent.webhookUrl && (
                            <span title={agent.webhookUrl}>
                              Webhook: {agent.webhookUrl.length > 40 ? agent.webhookUrl.slice(0, 40) + "..." : agent.webhookUrl}
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

          {/* Section 2: API Keys */}
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

          {/* Section 3: Agent Activity */}
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
                  aria-label="Refresh activity"
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
                      <th className="pb-2 pr-4 hidden sm:table-cell">
                        Agent Key
                      </th>
                      <th className="pb-2 pr-4">Context</th>
                      <th className="pb-2 pr-4">Decision</th>
                      <th className="pb-2 hidden sm:table-cell">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((a) => (
                      <tr key={`${a.timestamp}-${a.apiKeyPrefix}-${a.context}`} className="border-b border-border/50">
                        <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(a.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-2 pr-4 hidden sm:table-cell">
                          {a.apiKeyPrefix}
                        </td>
                        <td className="py-2 pr-4">{a.context}</td>
                        <td
                          className={cn(
                            "py-2 pr-4 font-bold",
                            DECISION_COLORS[a.decision],
                          )}
                        >
                          {a.decision}
                        </td>
                        <td className="py-2 hidden sm:table-cell">
                          {a.confidence}
                        </td>
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
