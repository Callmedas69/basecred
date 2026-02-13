"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
  useReadContract,
} from "wagmi";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  Shield,
  Activity,
  LayoutDashboard,
  Send,
  Loader2,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAIN_CONFIG } from "@/lib/blockchainConfig";
import {
  contextToBytes32,
  policyHashToBytes32,
  encodeDecision,
  type DecisionContext,
  type Decision,
} from "basecred-decision-engine";
import { DECISION_REGISTRY_ABI } from "@basecred/contracts/abi";
import {
  ONCHAIN_CONTRACTS,
  BASE_CHAIN_ID,
} from "@/lib/onChainContracts";

const DECISION_REGISTRY_ADDRESS = ONCHAIN_CONTRACTS.find(
  (c) => c.name === "Decision Registry",
)!.address as `0x${string}`;

/**
 * Browser-compatible subjectToBytes32.
 * Uses Web Crypto API (SHA-256) instead of Node.js crypto.
 * Must stay in sync with: packages/decision-engine/src/encoding/subject.ts
 */
async function subjectToBytes32Browser(
  subject: string,
): Promise<`0x${string}`> {
  const normalized = subject.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hashHex}` as `0x${string}`;
}

const CONTEXT_DESCRIPTIONS: Record<string, string> = {
  "allowlist.general": "General Access Allowlist",
  comment: "Comment Permission",
  publish: "Publishing Rights",
  apply: "Application Submission",
  "governance.vote": "Governance Voting",
};

const DECISION_LABELS: Record<string, { label: string; color: string }> = {
  ALLOW: { label: "Eligible", color: "text-emerald-600" },
  ALLOW_WITH_LIMITS: { label: "Limited", color: "text-amber-600" },
  DENY: { label: "Not Ready", color: "text-red-600" },
};

interface DecisionResult {
  decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS";
  accessStatus?: string;
  blockingFactors?: string[];
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
  policyHash?: string;
}

interface ProofData {
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  publicSignals: [string, string, string];
  policyHash: string;
  contextId: number;
}

interface ContextResult {
  context: string;
  decision: DecisionResult | null;
  proof: ProofData | null;
  loading: boolean;
  proofLoading: boolean;
  error: string | null;
}

export default function HumanPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [contexts, setContexts] = useState<string[]>([]);
  const [contextsLoading, setContextsLoading] = useState(true);
  const [contextResults, setContextResults] = useState<
    Map<string, ContextResult>
  >(new Map());
  const [selectedContext, setSelectedContext] = useState<string>("");

  const [submitPhases, setSubmitPhases] = useState<
    Map<string, "wallet" | "confirming">
  >(new Map());
  const [submitResults, setSubmitResults] = useState<
    Map<string, { txHash?: string; error?: string }>
  >(new Map());
  const [pendingTx, setPendingTx] = useState<{
    ctx: string;
    hash: `0x${string}`;
  } | null>(null);

  // Tracks in-flight evaluation requests (ref is synchronous, unlike state updaters in React 19)
  const evaluatingRef = useRef<Set<string>>(new Set());

  const { writeContractAsync } = useWriteContract();
  const isWrongChain = chainId !== BASE_CHAIN_ID;

  // Watch for transaction confirmation
  const { data: txReceipt, error: txReceiptError } =
    useWaitForTransactionReceipt({
      hash: pendingTx?.hash,
      chainId: BASE_CHAIN_ID,
    });

  // Handle receipt arrival
  useEffect(() => {
    if (!pendingTx) return;
    const { ctx, hash } = pendingTx;

    if (txReceipt) {
      if (txReceipt.status === "reverted") {
        setSubmitResults((prev) => {
          const next = new Map(prev);
          next.set(ctx, { error: "Transaction reverted on-chain" });
          return next;
        });
      } else {
        setSubmitResults((prev) => {
          const next = new Map(prev);
          next.set(ctx, { txHash: hash });
          return next;
        });
      }
      setSubmitPhases((prev) => {
        const n = new Map(prev);
        n.delete(ctx);
        return n;
      });
      setPendingTx(null);
    }

    if (txReceiptError) {
      setSubmitResults((prev) => {
        const next = new Map(prev);
        next.set(ctx, {
          error: txReceiptError.message || "Failed to confirm transaction",
        });
        return next;
      });
      setSubmitPhases((prev) => {
        const n = new Map(prev);
        n.delete(ctx);
        return n;
      });
      setPendingTx(null);
    }
  }, [txReceipt, txReceiptError, pendingTx]);

  // Check if the contract is in restricted mode
  const { data: isRestricted } = useReadContract({
    address: DECISION_REGISTRY_ADDRESS,
    abi: DECISION_REGISTRY_ABI,
    functionName: "restricted",
    chainId: BASE_CHAIN_ID,
  });

  // Check if connected wallet is authorized (only relevant if restricted)
  const { data: isAuthorized } = useReadContract({
    address: DECISION_REGISTRY_ADDRESS,
    abi: DECISION_REGISTRY_ABI,
    functionName: "authorizedSubmitters",
    args: address ? [address] : undefined,
    chainId: BASE_CHAIN_ID,
    query: { enabled: !!address && isRestricted === true },
  });

  const canSubmit = !isRestricted || isAuthorized === true;

  // Fetch available contexts on mount
  useEffect(() => {
    const fetchContexts = async () => {
      setContextsLoading(true);
      try {
        const res = await fetch("/api/v1/contexts");
        if (res.ok) {
          const data = await res.json();
          const ctxList = data.contexts || [];
          setContexts(ctxList);
          if (ctxList.length > 0) setSelectedContext(ctxList[0]);
        }
      } catch (err) {
        console.error("Failed to fetch contexts", err);
      } finally {
        setContextsLoading(false);
      }
    };
    fetchContexts();
  }, []);

  // Evaluate a single context with ZK proof (the single source of truth)
  const evaluateContext = useCallback(
    async (ctx: string, walletAddress: string) => {
      // Guard with ref (synchronous) — React 19 defers state updater execution
      if (evaluatingRef.current.has(ctx)) return;
      evaluatingRef.current.add(ctx);

      setContextResults((prev) => {
        const existing = prev.get(ctx);
        if (existing?.decision) return prev; // already have a result
        const next = new Map(prev);
        next.set(ctx, {
          context: ctx,
          decision: null,
          proof: null,
          loading: true,
          proofLoading: false,
          error: null,
        });
        return next;
      });

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);

        const res = await fetch("/api/v1/decide-with-proof", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: walletAddress, context: ctx }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          let message = `Evaluation failed (${res.status})`;
          try {
            const errorData = await res.json();
            message = errorData.message || message;
          } catch {
            /* non-JSON response */
          }
          throw new Error(message);
        }

        const data = await res.json();

        // Map API response to DecisionResult + ProofData
        const decision: DecisionResult = {
          decision: data.decision,
          explain: data.explain || [],
          signals: data.signals,
          policyHash: data.policyHash,
        };

        const proof: ProofData = {
          proof: data.proof,
          publicSignals: data.publicSignals,
          policyHash: data.policyHash,
          contextId: data.contextId,
        };

        setContextResults((prev) => {
          const next = new Map(prev);
          next.set(ctx, {
            context: ctx,
            decision,
            proof,
            loading: false,
            proofLoading: false,
            error: null,
          });
          return next;
        });
      } catch (err: any) {
        const message =
          err.name === "AbortError"
            ? "Evaluation timed out. ZK proof generation can take up to 60s — please retry."
            : err.message || "Evaluation failed";

        setContextResults((prev) => {
          const next = new Map(prev);
          next.set(ctx, {
            context: ctx,
            decision: null,
            proof: null,
            loading: false,
            proofLoading: false,
            error: message,
          });
          return next;
        });
      } finally {
        evaluatingRef.current.delete(ctx);
      }
    },
    [],
  );

  // Auto-evaluate the selected context when wallet connects or context changes
  useEffect(() => {
    if (isConnected && address && selectedContext && contexts.length > 0) {
      evaluateContext(selectedContext, address);
    }
  }, [isConnected, address, selectedContext, contexts, evaluateContext]);

  // Clear results when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setContextResults(new Map());
      setSubmitResults(new Map());
      setSubmitPhases(new Map());
      setPendingTx(null);
    }
  }, [isConnected]);

  // Get current context result
  const currentContextResult = selectedContext
    ? contextResults.get(selectedContext)
    : null;
  const currentDecision = currentContextResult?.decision;
  const currentProof = currentContextResult?.proof;

  // Helper to format signal values
  const formatSignal = (val: string | undefined) => {
    if (!val) return "N/A";
    return val
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Check if the selected context is currently loading
  const isContextLoading = currentContextResult?.loading ?? false;

  // Helper to set per-context submit phase
  const setPhase = (ctx: string, phase: "wallet" | "confirming" | null) => {
    setSubmitPhases((prev) => {
      const next = new Map(prev);
      if (phase === null) {
        next.delete(ctx);
      } else {
        next.set(ctx, phase);
      }
      return next;
    });
  };

  // Submit on-chain — proof is always available (ZK-first)
  const handleSubmitOnChain = async (ctx: string) => {
    const ctxResult = contextResults.get(ctx);
    if (!ctxResult?.decision || !ctxResult?.proof || !address) return;

    const proof = ctxResult.proof;

    setSubmitResults((prev) => {
      const next = new Map(prev);
      next.delete(ctx);
      return next;
    });

    try {
      // Step 1: Encode parameters for contract call
      setPhase(ctx, "wallet");

      const subjectHash = await subjectToBytes32Browser(address);
      const contextBytes = contextToBytes32(ctx as DecisionContext);
      const decisionValue = encodeDecision(
        ctxResult.decision.decision as Decision,
      );
      const policyHashBytes = policyHashToBytes32(proof.policyHash);

      // Convert proof strings to bigints for contract call
      const proofA: [bigint, bigint] = [
        BigInt(proof.proof.a[0]),
        BigInt(proof.proof.a[1]),
      ];
      const proofB: [[bigint, bigint], [bigint, bigint]] = [
        [BigInt(proof.proof.b[0][0]), BigInt(proof.proof.b[0][1])],
        [BigInt(proof.proof.b[1][0]), BigInt(proof.proof.b[1][1])],
      ];
      const proofC: [bigint, bigint] = [
        BigInt(proof.proof.c[0]),
        BigInt(proof.proof.c[1]),
      ];
      const pubSignals: [bigint, bigint, bigint] = [
        BigInt(proof.publicSignals[0]),
        BigInt(proof.publicSignals[1]),
        BigInt(proof.publicSignals[2]),
      ];

      // Step 2: Call writeContract (triggers wallet popup)
      const txHash = await writeContractAsync({
        address: DECISION_REGISTRY_ADDRESS,
        abi: DECISION_REGISTRY_ABI,
        functionName: "submitDecision",
        args: [
          subjectHash,
          contextBytes,
          decisionValue,
          policyHashBytes,
          proofA,
          proofB,
          proofC,
          pubSignals,
        ],
        chainId: BASE_CHAIN_ID,
      });

      // Step 3: Wait for confirmation via useWaitForTransactionReceipt hook
      setPhase(ctx, "confirming");
      setPendingTx({ ctx, hash: txHash });
      // The useEffect watching txReceipt will handle success/failure and clear phase
      return;
    } catch (err: any) {
      const message = err.shortMessage || err.message || "Submission failed";

      setSubmitResults((prev) => {
        const next = new Map(prev);
        next.set(ctx, { error: message });
        return next;
      });

      setPhase(ctx, null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30 overflow-x-hidden">
      <Navbar />
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 pt-24 md:pt-28 lg:pt-32 px-4 sm:px-6 md:px-12 pb-8 sm:pb-12 md:pb-16">
        {/* Header */}
        <div className="space-y-3 md:space-y-4 text-center md:text-left">
          <h1 className="text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[8rem] font-black tracking-tighter leading-[0.8] text-foreground select-none uppercase break-words">
            Human
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed pl-2 border-l-4 border-teal-500">
            {isConnected
              ? "See your onchain reputation and submit verified decisions."
              : "Connect your wallet to explore your reputation signals."}
          </p>
        </div>

        {/* Initial Loading State - Contexts Loading */}
        {contextsLoading && (
          <div className="animate-in fade-in py-12 md:py-16 text-center">
            <div className="max-w-md mx-auto space-y-4 px-4">
              <Loader2 className="w-8 h-8 mx-auto text-teal-500 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Loading contexts...
              </p>
            </div>
          </div>
        )}

        {/* Not Connected State */}
        {!contextsLoading && !isConnected && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 py-12 md:py-24 text-center border-2 border-dashed border-border/50 rounded-2xl md:rounded-3xl bg-muted/10">
            <div className="max-w-md mx-auto space-y-6 md:space-y-8 px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-3 md:space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-muted-foreground">
                  Connect Your Wallet
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground/80 leading-relaxed">
                  Connect your wallet to see your normalized signals,
                  eligibility status, and submit verified decisions on-chain.
                </p>
              </div>
              <div className="flex justify-center">
                <Link href="http://docs.zkbasecred.xyz" target="_blank">
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto text-sm sm:text-base"
                  >
                    What is this data?
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Per-Context Loading State (ZK evaluation in progress) */}
        {!contextsLoading && isConnected && isContextLoading && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-6 md:space-y-8">
            {/* Context Tabs (visible during loading so user can switch) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap">
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Context:</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
                {contexts.map((ctx) => {
                  const ctxResult = contextResults.get(ctx);
                  const decision = ctxResult?.decision?.decision;

                  return (
                    <button
                      key={ctx}
                      onClick={() => {
                        setSelectedContext(ctx);
                        if (address) evaluateContext(ctx, address);
                      }}
                      className={cn(
                        "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border whitespace-nowrap flex items-center gap-1.5",
                        selectedContext === ctx
                          ? "bg-foreground text-background border-foreground shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {ctx}
                      {ctxResult?.loading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : decision ? (
                        <span
                          className={cn(
                            "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
                            decision === "ALLOW"
                              ? "bg-emerald-500"
                              : decision === "DENY"
                                ? "bg-red-500"
                                : "bg-yellow-500",
                          )}
                        />
                      ) : ctxResult?.error ? (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loading indicator */}
            <div className="py-12 md:py-16 text-center border border-border/50 rounded-2xl md:rounded-3xl bg-muted/10">
              <div className="max-w-md mx-auto space-y-6 px-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Evaluating with ZK Proof
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Generating a zero-knowledge proof for{" "}
                    <span className="font-mono text-foreground">
                      {selectedContext}
                    </span>
                    . This typically takes 10–30 seconds.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
                  <Shield className="w-3.5 h-3.5 text-teal-500" />
                  ZK circuit is the single source of truth
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results (decision + proof always arrive together from ZK endpoint) */}
        {!contextsLoading &&
          isConnected &&
          !isContextLoading &&
          currentDecision &&
          currentProof && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6 md:space-y-8">
              {/* Decision Card */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl md:rounded-[2rem] border transition-all duration-500",
                  currentDecision.decision === "ALLOW"
                    ? "border-emerald-500/30 bg-emerald-50 shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)]"
                    : currentDecision.decision === "DENY"
                      ? "border-red-500/30 bg-red-50 shadow-[0_0_60px_-15px_rgba(239,68,68,0.3)]"
                      : "border-yellow-500/30 bg-yellow-50 shadow-[0_0_60px_-15px_rgba(234,179,8,0.3)]",
                )}
              >
                <div className="relative z-10 p-6 sm:p-8 md:p-12">
                  <div className="space-y-3 md:space-y-4">
                    <div className="font-mono text-xs sm:text-sm tracking-widest text-gray-500 flex items-center gap-2">
                      <span className="opacity-50">&gt;_</span> REPUTATION
                      DECISION
                    </div>
                    <div
                      className={cn(
                        "text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter uppercase break-words leading-[0.85]",
                        currentDecision.decision === "ALLOW"
                          ? "text-emerald-600 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                          : currentDecision.decision === "DENY"
                            ? "text-red-600 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                            : "text-yellow-600 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]",
                      )}
                    >
                      {currentDecision.decision.replace(/_/g, " ")}
                    </div>
                    <div className="text-gray-600 font-mono text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
                      {CONTEXT_DESCRIPTIONS[selectedContext] || selectedContext}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] sm:text-xs font-mono uppercase tracking-wider bg-white/60",
                          DECISION_LABELS[currentDecision.decision]?.color ||
                            "text-foreground",
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {DECISION_LABELS[currentDecision.decision]?.label ||
                          currentDecision.decision}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-teal-500/30 text-[10px] sm:text-xs font-mono uppercase tracking-wider bg-teal-50/60 text-teal-600">
                        <Shield className="w-3 h-3" />
                        ZK Verified
                      </span>
                    </div>

                    {/* Seal On-Chain Button */}
                    <div className="pt-4 border-t border-gray-200/50 mt-4 flex flex-wrap gap-3 items-center">
                      {submitResults.get(selectedContext)?.txHash ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Confirmed on-chain
                            </span>
                          </div>
                          <a
                            href={CHAIN_CONFIG.txUrl(submitResults.get(selectedContext)?.txHash ?? "")}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-teal-600 hover:text-teal-500 underline font-mono break-all"
                          >
                            View on BaseScan
                          </a>
                        </div>
                      ) : submitResults.get(selectedContext)?.error ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-sm text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {submitResults.get(selectedContext)?.error}
                          </div>
                          <Button
                            onClick={() => handleSubmitOnChain(selectedContext)}
                            variant="outline"
                            size="sm"
                          >
                            Retry
                          </Button>
                        </div>
                      ) : !canSubmit ? (
                        <div className="text-sm text-amber-600 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Contract is restricted. Your wallet is not authorized
                          to submit.
                        </div>
                      ) : isWrongChain ? (
                        <Button
                          onClick={() =>
                            switchChain({ chainId: BASE_CHAIN_ID })
                          }
                          className="bg-amber-600 text-white hover:bg-amber-700"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Switch to Base Sepolia
                        </Button>
                      ) : (
                        (() => {
                          const phase = submitPhases.get(selectedContext);
                          return (
                            <Button
                              onClick={() =>
                                handleSubmitOnChain(selectedContext)
                              }
                              disabled={!!phase}
                              className="bg-foreground text-background hover:bg-foreground/90"
                            >
                              {phase === "wallet" ? (
                                <>
                                  <Wallet className="w-4 h-4 mr-2" />
                                  Confirm in Wallet...
                                </>
                              ) : phase === "confirming" ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Confirming...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Seal On-Chain
                                </>
                              )}
                            </Button>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>

                {/* Glow Mesh */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply",
                    currentDecision.decision === "ALLOW"
                      ? "bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.3),transparent_60%)]"
                      : currentDecision.decision === "DENY"
                        ? "bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.3),transparent_60%)]"
                        : "bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.3),transparent_60%)]",
                  )}
                />
              </div>

              {/* Context Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap">
                  <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Context:</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
                  {contexts.map((ctx) => {
                    const ctxResult = contextResults.get(ctx);
                    const decision = ctxResult?.decision?.decision;

                    return (
                      <button
                        key={ctx}
                        onClick={() => {
                          setSelectedContext(ctx);
                          // Auto-evaluate if not yet cached
                          if (address) evaluateContext(ctx, address);
                        }}
                        className={cn(
                          "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border whitespace-nowrap flex items-center gap-1.5",
                          selectedContext === ctx
                            ? "bg-foreground text-background border-foreground shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {ctx}
                        {ctxResult?.loading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : decision ? (
                          <span
                            className={cn(
                              "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
                              decision === "ALLOW"
                                ? "bg-emerald-500"
                                : decision === "DENY"
                                  ? "bg-red-500"
                                  : "bg-yellow-500",
                            )}
                          />
                        ) : ctxResult?.error ? (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wallet & Signals Summary */}
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-muted rounded-md border border-border text-xs sm:text-sm font-mono text-foreground font-bold uppercase tracking-wider">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                    TRUST: {formatSignal(currentDecision.signals?.trust)}
                  </div>
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-muted rounded-md border border-border text-xs sm:text-sm font-mono font-bold uppercase tracking-wider",
                      currentDecision.signals?.spamRisk === "HIGH" ||
                        currentDecision.signals?.spamRisk === "VERY_HIGH"
                        ? "text-red-500"
                        : "text-foreground",
                    )}
                  >
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    SPAM: {formatSignal(currentDecision.signals?.spamRisk)}
                  </div>
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-muted rounded-md border border-border text-xs sm:text-sm font-mono text-foreground font-bold uppercase tracking-wider">
                    <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                    COVERAGE:{" "}
                    {Math.round(
                      (currentDecision.signals?.signalCoverage || 0) * 100,
                    )}
                    %
                  </div>
                </div>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl">
                  Your wallet shows{" "}
                  <span className="text-foreground font-medium">
                    {formatSignal(currentDecision.signals?.trust).toLowerCase()}
                  </span>{" "}
                  trust signals with{" "}
                  <span className="text-foreground font-medium">
                    {formatSignal(
                      currentDecision.signals?.spamRisk,
                    ).toLowerCase()}
                  </span>{" "}
                  spam indicators, based on available on-chain and social data.
                </p>
              </div>

              {/* Detailed View Tabs */}
              <Tabs defaultValue="structured" className="w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 md:mb-6 border-b border-border pb-3 sm:pb-4">
                  <TabsList className="bg-transparent border-none p-0 h-auto gap-4 sm:gap-8">
                    <TabsTrigger
                      value="structured"
                      className="bg-transparent border-none p-0 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-none rounded-none text-base sm:text-lg transition-colors hover:text-foreground"
                    >
                      Signals
                    </TabsTrigger>
                    <TabsTrigger
                      value="proof"
                      className="bg-transparent border-none p-0 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-none rounded-none text-base sm:text-lg transition-colors hover:text-foreground"
                    >
                      Proof
                    </TabsTrigger>
                    <TabsTrigger
                      value="json"
                      className="bg-transparent border-none p-0 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-none rounded-none text-base sm:text-lg transition-colors hover:text-foreground"
                    >
                      JSON
                    </TabsTrigger>
                  </TabsList>
                  <div className="text-xs text-muted-foreground font-mono">
                    context: {selectedContext}
                  </div>
                </div>

                {/* Signals Tab */}
                <TabsContent
                  value="structured"
                  className="space-y-8 md:space-y-12"
                >
                  <div className="grid sm:grid-cols-2 gap-x-6 md:gap-x-12 gap-y-0 font-mono text-sm md:text-base border-t border-border pt-3 sm:pt-4">
                    <div className="flex justify-between items-center py-2.5 sm:py-3 border-b border-border/50">
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">
                        trust
                      </span>
                      <span className="font-bold text-foreground text-xs sm:text-sm md:text-base">
                        {formatSignal(currentDecision.signals?.trust)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 sm:py-3 border-b border-border/50">
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">
                        socialTrust
                      </span>
                      <span className="font-bold text-foreground text-xs sm:text-sm md:text-base">
                        {formatSignal(currentDecision.signals?.socialTrust)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 sm:py-3 border-b border-border/50">
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">
                        builder
                      </span>
                      <span className="font-bold text-foreground text-xs sm:text-sm md:text-base">
                        {formatSignal(currentDecision.signals?.builder)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 sm:py-3 border-b border-border/50">
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">
                        creator
                      </span>
                      <span className="font-bold text-foreground text-xs sm:text-sm md:text-base">
                        {formatSignal(currentDecision.signals?.creator)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 sm:py-3 border-b border-border/50">
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">
                        spamRisk
                      </span>
                      <span
                        className={cn(
                          "font-bold text-xs sm:text-sm md:text-base",
                          currentDecision.signals?.spamRisk === "HIGH" ||
                            currentDecision.signals?.spamRisk === "VERY_HIGH"
                            ? "text-red-500"
                            : "text-foreground",
                        )}
                      >
                        {formatSignal(currentDecision.signals?.spamRisk)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 sm:py-3 border-b border-border/50">
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">
                        recencyDays
                      </span>
                      <span className="font-bold text-foreground text-xs sm:text-sm md:text-base">
                        {currentDecision.signals?.recencyDays ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 sm:py-3 border-b border-border/50">
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">
                        signalCoverage
                      </span>
                      <span className="font-bold text-foreground text-xs sm:text-sm md:text-base">
                        {Math.round(
                          (currentDecision.signals?.signalCoverage || 0) * 100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 sm:py-3 border-b border-border/50">
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">
                        decision
                      </span>
                      <span
                        className={cn(
                          "font-bold text-xs sm:text-sm md:text-base",
                          currentDecision.decision === "ALLOW"
                            ? "text-emerald-500"
                            : currentDecision.decision === "DENY"
                              ? "text-red-500"
                              : "text-yellow-500",
                        )}
                      >
                        {currentDecision.decision}
                      </span>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-3 md:space-y-4 pt-3 sm:pt-4">
                    <h3 className="font-mono text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      Explanation
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-4 sm:p-6 space-y-2 border border-border">
                      {currentDecision.explain.map(
                        (reason: string, i: number) => (
                          <div
                            key={i}
                            className="flex gap-2 sm:gap-3 text-muted-foreground"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 sm:mt-2 shrink-0 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                            <span className="font-mono text-xs sm:text-sm break-words">
                              {reason}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Proof Tab */}
                <TabsContent value="proof" className="space-y-6">
                  {currentProof && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-mono text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                          Policy Hash
                        </h3>
                        <div className="bg-muted/30 rounded-lg p-4 border border-border">
                          <code className="text-xs sm:text-sm font-mono break-all text-foreground">
                            {currentProof.policyHash}
                          </code>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-mono text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                          Public Signals
                        </h3>
                        <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-1">
                          <div className="flex justify-between text-xs sm:text-sm font-mono">
                            <span className="text-muted-foreground">
                              policyHash:
                            </span>
                            <span className="text-foreground truncate max-w-[200px]">
                              {currentProof.publicSignals[0]}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs sm:text-sm font-mono">
                            <span className="text-muted-foreground">
                              contextId:
                            </span>
                            <span className="text-foreground">
                              {currentProof.publicSignals[1]}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs sm:text-sm font-mono">
                            <span className="text-muted-foreground">
                              decision:
                            </span>
                            <span className="text-foreground">
                              {currentProof.publicSignals[2]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-mono text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                          Groth16 Proof
                        </h3>
                        <Card className="bg-black/90 border-border">
                          <CardContent className="p-0">
                            <pre className="p-4 overflow-auto text-[10px] sm:text-xs font-mono text-zinc-300 max-h-[300px] leading-relaxed">
                              {JSON.stringify(currentProof.proof, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* JSON Tab */}
                <TabsContent value="json">
                  <Card className="bg-black/90 border-border shadow-2xl">
                    <CardContent className="p-0">
                      <pre className="p-4 sm:p-6 overflow-auto text-[10px] sm:text-xs md:text-sm font-mono text-zinc-300 max-h-[400px] sm:max-h-[600px] leading-relaxed">
                        {JSON.stringify(currentDecision, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

        {/* Connected but current context has error */}
        {!contextsLoading &&
          isConnected &&
          !isContextLoading &&
          !currentDecision &&
          currentContextResult?.error && (
            <div className="animate-in fade-in space-y-6 md:space-y-8">
              {/* Context Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap">
                  <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Context:</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
                  {contexts.map((ctx) => {
                    const ctxResult = contextResults.get(ctx);
                    const decision = ctxResult?.decision?.decision;

                    return (
                      <button
                        key={ctx}
                        onClick={() => {
                          setSelectedContext(ctx);
                          if (address) evaluateContext(ctx, address);
                        }}
                        className={cn(
                          "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border whitespace-nowrap flex items-center gap-1.5",
                          selectedContext === ctx
                            ? "bg-foreground text-background border-foreground shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {ctx}
                        {ctxResult?.loading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : decision ? (
                          <span
                            className={cn(
                              "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
                              decision === "ALLOW"
                                ? "bg-emerald-500"
                                : decision === "DENY"
                                  ? "bg-red-500"
                                  : "bg-yellow-500",
                            )}
                          />
                        ) : ctxResult?.error ? (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error state */}
              <div className="py-12 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/10">
                <div className="max-w-md mx-auto space-y-4 px-4">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h2 className="text-xl font-bold text-muted-foreground">
                    Evaluation Failed
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentContextResult.error}
                  </p>
                  <Button
                    onClick={() => {
                      if (!address) return;
                      // Clear the error to allow re-evaluation
                      setContextResults((prev) => {
                        const next = new Map(prev);
                        next.delete(selectedContext);
                        return next;
                      });
                      evaluateContext(selectedContext, address);
                    }}
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}

        {/* Connected but no contexts available */}
        {!contextsLoading && isConnected && contexts.length === 0 && (
          <div className="animate-in fade-in py-12 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/10">
            <div className="max-w-md mx-auto space-y-4 px-4">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-bold text-muted-foreground">
                No Contexts Available
              </h2>
              <p className="text-sm text-muted-foreground">
                Could not load decision contexts. Please check the API
                configuration.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
