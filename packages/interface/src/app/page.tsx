"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  X,
  Shield,
  Activity,
  Hexagon,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Navbar } from "@/components/Navbar";

export default function Home() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } },
  };

  return (
    <div className="bg-background font-sans text-foreground selection:bg-teal-500/30 selection:text-teal-200">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[calc(100vh-5rem)] pt-[clamp(5rem,10vw,9rem)] pb-[clamp(3rem,5vw,6rem)] z-10 items-center">
        <motion.div
          className="container mx-auto px-6 relative z-10 text-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/80 border border-border text-xs font-mono text-foreground mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live on Base Mainnet
          </motion.div>

          <motion.h1
            variants={item}
            className="text-[clamp(2.5rem,8vw,10rem)] text-foreground font-black tracking-tighter mb-8 leading-none"
          >
            Reputation without
            <br />
            <span className="bg-linear-to-r from-teal-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">
              opinion.
            </span>
          </motion.h1>
          <motion.p
            variants={item}
            className="text-[clamp(1.125rem,2vw,1.5rem)] text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            BaseCred aggregates onchain signals into a transparent JSON output
            you can use for gating, moderation, rewards, or access control.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full px-4 sm:px-0"
          >
            <Link href="/explorer" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="h-auto py-3 sm:py-4 px-6 sm:px-10 text-base sm:text-lg bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl relative overflow-hidden group flex flex-col items-center w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center font-bold">
                  Open Explorer{" "}
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="relative z-10 text-xs font-normal opacity-70 mt-1">
                  Inspect real wallets & signals
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-background/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
            </Link>
            <Link
              href="http://localhost:4000"
              target="_blank"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                variant="outline"
                className="h-auto py-3 sm:py-4 px-6 sm:px-10 text-base sm:text-lg border-border bg-background/50 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-accent/80 hover:border-accent-foreground/20 transition-all flex flex-col items-center w-full sm:w-auto"
              >
                <span className="font-bold">Read the Specs</span>
                <span className="text-xs font-normal opacity-70 mt-1">
                  API schema, contexts, guarantees
                </span>
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Why It Matters */}
      <section className="py-[clamp(4rem,10vw,8rem)] border-t border-border bg-muted/20 backdrop-blur-sm relative z-10">
        <motion.div
          className="w-full px-6 md:px-12 mb-[clamp(3rem,6vw,6rem)]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.h2
            variants={item}
            className="text-[clamp(3rem,10vw,9rem)] font-black text-foreground tracking-tighter leading-none"
          >
            <span className="text-teal-500 text-[clamp(1.5rem,3vw,2.5rem)] block mb-2 font-bold tracking-normal">
              01.
            </span>
            WHY IT MATTERS
          </motion.h2>
        </motion.div>

        <motion.div
          className="container mx-auto px-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="grid md:grid-cols-2 gap-[clamp(2rem,5vw,6rem)]">
            {/* What It Is */}
            <motion.div variants={item} className="space-y-8 group">
              <div className="inline-flex items-center gap-2 text-teal-400 font-mono text-sm uppercase tracking-wider">
                <Check className="w-4 h-4" /> The Primitive
              </div>
              <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight">
                A unified signal layer.
              </h2>
              <ul className="space-y-4 sm:space-y-6">
                {[
                  "Aggregates signals (Ethos, Neynar, Talent Protocol)",
                  "Normalizes raw scores into stable tiers",
                  "Producse a single JSON object",
                  "Coverage indicators & audit-friendly reasons",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-3 sm:gap-4 text-base sm:text-lg text-muted-foreground group-hover:text-foreground transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 sm:mt-2.5 shrink-0 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* What It Is Not */}
            <motion.div variants={item} className="space-y-8 group">
              <div className="inline-flex items-center gap-2 text-red-400 font-mono text-sm uppercase tracking-wider">
                <X className="w-4 h-4" /> The Anti-Pattern
              </div>
              <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight">
                Not a judgment system.
              </h2>
              <ul className="space-y-4 sm:space-y-6">
                {[
                  "Not a credit score",
                  "Not a recommendation engine",
                  "Not a whitelist provider",
                  "Not a 'Good Person' badge",
                  "Not a reputation oracle that enforces outcomes",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-3 sm:gap-4 text-base sm:text-lg text-muted-foreground group-hover:text-foreground transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 sm:mt-2.5 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-[clamp(4rem,10vw,8rem)] relative z-10">
        <motion.div
          className="w-full px-6 md:px-12 mb-[clamp(3rem,6vw,6rem)]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.h2
            variants={item}
            className="text-[clamp(3rem,10vw,9rem)] font-black text-foreground tracking-tighter leading-none"
          >
            <span className="text-teal-500 text-[clamp(1.5rem,3vw,2.5rem)] block mb-2 font-bold tracking-normal">
              02.
            </span>
            HOW IT WORKS
          </motion.h2>
        </motion.div>

        <motion.div
          className="container mx-auto px-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 relative">
            {[
              {
                icon: (
                  <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
                ),
                title: "1. Ingest",
                desc: "We fetch raw data from trusted providers like Ethos and Neynar.",
                gradient: "from-indigo-500/20 to-blue-500/5",
              },
              {
                icon: (
                  <Hexagon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                ),
                title: "2. Normalize",
                desc: "Scores are normalized into standard Tiers (High, Low, Neutral).",
                gradient: "from-purple-500/20 to-pink-500/5",
              },
              {
                icon: (
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-teal-400" />
                ),
                title: "3. Deliver",
                desc: "You get a unified JSON object with decision context and audit trails.",
                gradient: "from-teal-500/20 to-emerald-500/5",
              },
            ].map((step, i) => (
              <motion.div key={i} variants={item}>
                <Card className="bg-card/50 border-border/50 hover:border-border transition-all duration-500 group overflow-hidden relative h-full">
                  <div
                    className={cn(
                      "absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-700",
                      step.gradient,
                    )}
                  />
                  <CardContent className="pt-6 sm:pt-10 pb-6 sm:pb-8 px-4 sm:px-6 relative z-10">
                    <div className="mb-4 sm:mb-6 bg-card w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center border border-border group-hover:border-foreground/20 transition-colors shadow-2xl">
                      {step.icon}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground group-hover:text-foreground/90 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground group-hover:text-foreground/80 leading-relaxed text-base sm:text-lg transition-colors">
                      {step.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border overflow-hidden">
        {/* CONTENT LAYER */}
        <motion.div
          className="relative min-h-screen z-10 px-[clamp(1.5rem,4vw,4rem)] pt-[clamp(1rem,2vw,3rem)] pb-0 mb-0 flex flex-col justify-between bg-blue"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {/* TOP SECTION */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-[clamp(2rem,4vw,6rem)]">
            {/* LEFT / MESSAGE */}
            <div className="col-span-2 space-y-6 sm:space-y-8 max-w-xl">
              <motion.div variants={item} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                  System Operational
                </span>
              </motion.div>

              <motion.h3
                variants={item}
                className="text-[clamp(1.5rem,3vw,6rem)] font-semibold tracking-tighter text-foreground leading-none"
              >
                The decentralized reputation layer for the onchain economy.
              </motion.h3>
            </div>

            {/* NAVIGATION */}
            <motion.div variants={item} className="space-y-4 sm:space-y-6">
              <h4 className="font-mono text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                Navigation
              </h4>
              <ul className="space-y-2 sm:space-y-3 text-base sm:text-lg">
                <li>
                  <Link href="/explorer">Explorer</Link>
                </li>
                <li>
                  <Link href="http://localhost:4000" target="_blank">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="http://localhost:4000/integration"
                    target="_blank"
                  >
                    Integration Guide
                  </Link>
                </li>
              </ul>
            </motion.div>

            {/* CONNECT */}
            <motion.div variants={item} className="space-y-4 sm:space-y-6">
              <h4 className="font-mono text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                Connect
              </h4>
              <ul className="space-y-2 sm:space-y-3 text-base sm:text-lg">
                <li>
                  <Link href="#">Twitter / X</Link>
                </li>
                <li>
                  <Link href="#">GitHub</Link>
                </li>
                <li>
                  <Link href="#">Farcaster</Link>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* BOTTOM META */}
          <motion.div
            variants={item}
            className="flex flex-col items-end text-xs sm:text-sm text-muted-foreground w-full mt-8 sm:mt-0"
          >
            <div className="flex flex-col justify-between w-full gap-4 sm:gap-0 text-right">
              <div className="leading-relaxed">
                <p>© 2026 BaseCred Protocol.</p>
              </div>
              <div className="">
                <p>Designed for the Superchain.</p>
              </div>
            </div>

            {/*WORDMARK */}
            <div className="relative w-full pointer-events-none select-none text-center overflow-hidden">
              <h1 className="text-[22vw] leading-none font-semibold tracking-tighter text-foreground/60 whitespace-nowrap">
                basecred
              </h1>
            </div>
          </motion.div>
        </motion.div>
      </footer>
    </div>
  );
}
