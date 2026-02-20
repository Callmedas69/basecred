"use client"

import { Navbar } from "@/components/Navbar"

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-24 md:pt-28 lg:pt-32 p-4 sm:p-6 md:p-12">
        {/* Hero */}
        <div className="space-y-4 mb-8 md:mb-12 text-center">
          <h1 className="text-[clamp(2rem,5vw,4rem)] font-black tracking-tight">
            Use Cases
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Real-world zkProof implementations
          </p>
        </div>

        {/* Placeholder */}
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground text-lg">Coming soon</p>
        </div>
      </div>
    </div>
  )
}
