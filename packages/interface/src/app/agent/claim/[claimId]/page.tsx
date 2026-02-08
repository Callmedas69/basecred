"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  Clock,
  Bot,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClaimDetails {
  status: "pending_claim" | "verified" | "expired" | "revoked";
  agentName?: string;
  verificationCode?: string;
  ownerAddress?: string;
  expiresAt?: number;
}

export default function ClaimPage() {
  const params = useParams<{ claimId: string }>();
  const claimId = params.claimId;

  const [loading, setLoading] = useState(true);
  const [claim, setClaim] = useState<ClaimDetails | null>(null);
  const [tweetUrl, setTweetUrl] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/agent/register/${claimId}/status`);
      const data = await res.json();
      setClaim(data);
    } catch {
      setClaim({ status: "expired" });
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Fetch full registration details for pending claims (need verification code + owner address)
  const [fullDetails, setFullDetails] = useState<{
    verificationCode: string;
    ownerAddress: string;
    agentName: string;
    expiresAt: number;
  } | null>(null);

  useEffect(() => {
    if (claim?.status === "pending_claim") {
      // Fetch the full details from a separate call that returns verification info
      // The status endpoint only returns status + agentName for security
      // The claim page needs the verification code — we embed it via the registration record
      // For now, we need a way to get the verification code. Let's use query params or a dedicated endpoint.
      // Since claimId is the bearer token (256-bit), we can safely expose verification code to holders.
      fetch(`/api/v1/agent/register/${claimId}/status?include=details`)
        .then((res) => res.json())
        .then((data) => {
          if (data.verificationCode) {
            setFullDetails({
              verificationCode: data.verificationCode,
              ownerAddress: data.ownerAddress || "",
              agentName: data.agentName || "",
              expiresAt: data.expiresAt || 0,
            });
          }
        })
        .catch(() => {});
    }
  }, [claim?.status, claimId]);

  const handleVerify = async () => {
    if (!tweetUrl.trim()) return;
    setVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch(`/api/v1/agent/register/${claimId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetUrl: tweetUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setVerified(true);
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const verificationCode = fullDetails?.verificationCode || "";
  const tweetTemplate = `I'm verifying my BaseCred agent. Code: ${verificationCode} @basecredxyz`;

  const copyTweet = () => {
    navigator.clipboard?.writeText(tweetTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!fullDetails?.expiresAt) return;
    const update = () => {
      const diff = fullDetails.expiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      setTimeLeft(`${hours}h ${minutes}m remaining`);
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [fullDetails?.expiresAt]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-24 md:pt-28 lg:pt-32 p-4 sm:p-6 md:p-12">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            <p className="text-muted-foreground">Loading claim details...</p>
          </div>
        )}

        {/* Expired / Not Found */}
        {!loading && (!claim || claim.status === "expired") && (
          <Card className="bg-card/70 border-border/70">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
              <h2 className="text-xl font-bold">Claim Expired or Not Found</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                This claim link has expired or doesn't exist. Ask your agent to register again.
              </p>
              <Button asChild variant="outline">
                <a href="/agent">Go to Agent Page</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Revoked */}
        {!loading && claim?.status === "revoked" && (
          <Card className="bg-card/70 border-border/70">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
              <h2 className="text-xl font-bold">Registration Revoked</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                This agent registration has been revoked by the owner.
              </p>
              <Button asChild variant="outline">
                <a href="/agent">Go to Agent Page</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Already Verified */}
        {!loading && (claim?.status === "verified" || verified) && (
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
              <h2 className="text-xl font-bold text-emerald-400">Agent Verified</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {claim?.agentName && (
                  <span className="font-mono text-foreground">{claim.agentName}</span>
                )}{" "}
                has been verified and activated. The agent can now check your reputation.
              </p>
              <Button asChild variant="outline">
                <a href="/agent">View Dashboard</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pending — Main Verification Flow */}
        {!loading && claim?.status === "pending_claim" && !verified && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Bot className="w-10 h-10 mx-auto text-teal-500" />
              <h1 className="text-2xl font-bold">Verify Agent Ownership</h1>
              <p className="text-sm text-muted-foreground">
                Confirm you own this agent by posting a verification code on X
              </p>
            </div>

            {/* Agent Details */}
            {fullDetails && (
              <Card className="bg-card/70 border-border/70">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Agent</span>
                    <span className="font-mono font-medium">{fullDetails.agentName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-mono text-xs">
                      {fullDetails.ownerAddress.slice(0, 6)}...{fullDetails.ownerAddress.slice(-4)}
                    </span>
                  </div>
                  {timeLeft && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expires</span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Clock className="w-3 h-3" />
                        {timeLeft}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 1: Post Tweet */}
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  Post this on X
                </div>

                <div className="relative">
                  <div className="bg-black/90 rounded-lg p-4 pr-12 text-sm font-mono text-zinc-200 break-all">
                    {verificationCode ? tweetTemplate : "Loading verification code..."}
                  </div>
                  <button
                    className="absolute top-3 right-3 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                    onClick={copyTweet}
                    disabled={!verificationCode}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {verificationCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <a
                      href={`https://x.com/intent/tweet?text=${encodeURIComponent(tweetTemplate)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-2" />
                      Open X to Post
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Submit Tweet URL */}
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  Paste your tweet URL
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="https://x.com/you/status/..."
                    value={tweetUrl}
                    onChange={(e) => setTweetUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleVerify}
                    disabled={verifying || !tweetUrl.trim()}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>

                {verifyError && (
                  <div className="text-sm text-red-400 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {verifyError}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
