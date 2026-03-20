"use client"

import { useState } from "react"
import { Navbar } from "@/components/Navbar"
import { CASE_STUDIES, type CaseStudy } from "@/use-cases/case-studies"
import { Copy, ArrowRight, ChevronRight } from "lucide-react"

export default function UseCasesPage() {
  const [activeId, setActiveId] = useState(CASE_STUDIES[0].id)
  const active = CASE_STUDIES.find((c) => c.id === activeId) ?? CASE_STUDIES[0]

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-24 md:pt-28 lg:pt-32 px-4 sm:px-6 md:px-12 pb-24">
        {/* Hero */}
        <div className="mb-12 md:mb-16">
          <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-black tracking-tighter leading-[0.9] mb-6">
            USE<br />
            <span className="text-muted-foreground">CASES</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl border-l-2 border-teal-500 pl-6">
            Real-world templates showing how zkBaseCred replaces manual, opaque
            reputation checks with instant, verifiable, privacy-preserving
            decisions.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="relative mb-12">
          <nav className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {CASE_STUDIES.map((cs) => (
              <button
                key={cs.id}
                onClick={() => setActiveId(cs.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeId === cs.id
                    ? "bg-teal-500/10 text-teal-400 border border-teal-500/30"
                    : "bg-white/5 text-muted-foreground border border-white/5 hover:border-white/10 hover:text-foreground"
                }`}
              >
                <span className="font-mono text-xs mr-2 opacity-60">
                  {String(cs.number).padStart(2, "0")}
                </span>
                {cs.context}
              </button>
            ))}
          </nav>
          <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent sm:hidden" aria-hidden="true" />
        </div>

        {/* Active Case Study */}
        <CaseStudySection study={active} />
      </div>
    </div>
  )
}

function CaseStudySection({ study }: { study: CaseStudy }) {
  return (
    <div className="space-y-16 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-teal-500 font-mono text-sm font-bold">
            {String(study.number).padStart(2, "0")}
          </span>
          <span className="font-mono text-sm text-muted-foreground bg-white/5 px-3 py-1 rounded border border-white/10">
            {study.context}
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
          {study.title}
        </h2>
        <p className="text-lg text-muted-foreground">{study.subtitle}</p>
      </div>

      {/* Problem */}
      <section className="space-y-6">
        <SectionLabel>The Problem</SectionLabel>
        <p className="text-muted-foreground leading-relaxed max-w-3xl">
          {study.problem.intro}
        </p>
        <div className="space-y-3">
          {study.problem.failureModes.map((mode, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/10"
            >
              <span className="text-red-400 font-mono text-sm font-bold mt-0.5 flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-zinc-300 leading-relaxed">{mode}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="space-y-6">
        <SectionLabel>The Solution</SectionLabel>
        <p className="text-muted-foreground leading-relaxed max-w-3xl">
          {study.solution.description}
        </p>

        {/* Before / After */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Before
            </span>
            <p className="text-sm text-zinc-400 font-mono leading-relaxed">
              {study.solution.beforeAfter.before}
            </p>
          </div>
          <div className="p-5 rounded-xl bg-teal-500/5 border border-teal-500/20 space-y-2">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              After
            </span>
            <p className="text-sm text-zinc-300 font-mono leading-relaxed">
              {study.solution.beforeAfter.after}
            </p>
          </div>
        </div>

        {/* Signal Badges */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Signals Evaluated
          </span>
          <div className="flex flex-wrap gap-2">
            {study.solution.signals.map((signal) => (
              <span
                key={signal}
                className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 text-sm font-mono border border-teal-500/20"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>

        {/* Code Snippet */}
        {study.solution.codeSnippet && (
          <CodeWindow title={`${study.context} integration`} language="typescript">
            {study.solution.codeSnippet}
          </CodeWindow>
        )}
      </section>

      {/* Results */}
      <section className="space-y-6">
        <SectionLabel>Expected Results</SectionLabel>
        <div className="space-y-3">
          {study.result.metrics.map((metric, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
            >
              <ChevronRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-zinc-300 leading-relaxed">{metric}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <blockquote className="border-l-2 border-teal-500 pl-6 py-2">
        <p className="text-lg italic text-muted-foreground">
          &ldquo;{study.result.keyQuote}&rdquo;
        </p>
      </blockquote>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
      <ArrowRight className="w-4 h-4 text-teal-500" />
      {children}
    </h3>
  )
}

function CodeWindow({
  title,
  children,
  language = "bash",
}: {
  title: string
  children: string
  language?: string
}) {
  return (
    <div className="rounded-xl overflow-hidden bg-[#09090b] border border-zinc-800 shadow-2xl ring-1 ring-white/5">
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
          </div>
          <span className="text-xs font-medium text-zinc-400 ml-2 font-mono">
            {title}
          </span>
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase">
          {language}
        </span>
      </div>
      <div className="p-6 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed text-zinc-300">
          {children}
        </pre>
      </div>
    </div>
  )
}
