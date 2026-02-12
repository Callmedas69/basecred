"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/Navbar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Loader2,
  AlertCircle,
  FileCheck2,
  Bot,
  Users,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
} from "lucide-react"

import type { ProtocolStats } from "@/use-cases/get-protocol-stats"

// =============================================================================
// Helpers
// =============================================================================

const OUTCOME_ICON: Record<number, React.ReactNode> = {
  0: <ShieldX className="w-5 h-5 text-red-400" />,
  1: <ShieldAlert className="w-5 h-5 text-amber-400" />,
  2: <ShieldCheck className="w-5 h-5 text-teal-400" />,
}

const OUTCOME_COLOR: Record<number, string> = {
  0: "text-red-400",
  1: "text-amber-400",
  2: "text-teal-400",
}

function formatLabel(label: string): string {
  return label
    .replace(/_/g, " ")
    .replace(/\./g, " · ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// =============================================================================
// Page
// =============================================================================

export default function StatsPage() {
  const [stats, setStats] = useState<ProtocolStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      try {
        const res = await fetch("/api/v1/stats")
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message || `HTTP ${res.status}`)
        }
        const data = await res.json()
        if (!cancelled) {
          setStats(data.stats)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load stats")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()
    return () => { cancelled = true }
  }, [])

  const totalOutcome = stats
    ? stats.decisionsByOutcome.reduce((sum, o) => sum + o.count, 0)
    : 0

  const maxContextCount = stats?.decisionsByContext.length
    ? Math.max(...stats.decisionsByContext.map((c) => c.count))
    : 0

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-24 md:pt-28 lg:pt-32 p-4 sm:p-6 md:p-12">
        {/* Hero */}
        <div className="space-y-4 mb-8 md:mb-12 text-center">
          <h1 className="text-[clamp(2rem,5vw,4rem)] font-black tracking-tight">
            Protocol Stats
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Real-time metrics from on-chain decisions and registered agents.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-center gap-3 justify-center py-20 text-red-400">
            <AlertCircle className="w-6 h-6" />
            <span className="text-lg">{error}</span>
          </div>
        )}

        {/* Stats */}
        {stats && !loading && (
          <div className="space-y-6">
            {/* Top row: 3 big numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                icon={<FileCheck2 className="w-6 h-6 text-teal-500" />}
                label="Total Decisions"
                value={stats.totalDecisions}
              />
              <StatCard
                icon={<Bot className="w-6 h-6 text-teal-500" />}
                label="Registered Agents"
                value={stats.uniqueAgents}
              />
              <StatCard
                icon={<Users className="w-6 h-6 text-teal-500" />}
                label="Unique Subjects"
                value={stats.uniqueSubjects}
              />
            </div>

            {/* Decisions by Outcome */}
            <Card className="bg-card/70 border-border/70">
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-lg font-bold mb-4">Decisions by Outcome</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {stats.decisionsByOutcome.map((o) => {
                    const pct = totalOutcome > 0
                      ? ((o.count / totalOutcome) * 100).toFixed(1)
                      : "0.0"
                    return (
                      <div
                        key={o.outcome}
                        className="flex items-center gap-3 rounded-lg bg-muted/50 p-4"
                      >
                        {OUTCOME_ICON[o.outcome]}
                        <div className="min-w-0">
                          <div className={`text-2xl font-bold tabular-nums ${OUTCOME_COLOR[o.outcome] ?? "text-foreground"}`}>
                            {o.count.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatLabel(o.label)} · {pct}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Decisions by Context */}
            {stats.decisionsByContext.length > 0 && (
              <Card className="bg-card/70 border-border/70">
                <CardContent className="p-5 sm:p-6">
                  <h2 className="text-lg font-bold mb-4">Decisions by Context</h2>
                  <div className="space-y-3">
                    {stats.decisionsByContext.map((c) => {
                      const barWidth = maxContextCount > 0
                        ? Math.max(4, (c.count / maxContextCount) * 100)
                        : 4
                      return (
                        <div key={c.contextId}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {formatLabel(c.label)}
                            </span>
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {c.count.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-teal-500 transition-all duration-500"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Last Updated */}
            <p className="text-center text-xs text-muted-foreground pt-2">
              Last updated: {new Date(stats.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Stat Card Component
// =============================================================================

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <Card className="bg-card/70 border-border/70">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-3xl font-bold tabular-nums">{value.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
