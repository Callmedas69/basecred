"use client";

import { Loader2, AlertCircle, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextResult {
  decision: { decision: string } | null;
  loading: boolean;
  error: string | null;
}

interface ContextTabBarProps {
  contexts: string[];
  selectedContext: string;
  contextResults: Map<string, ContextResult>;
  onSelect: (ctx: string) => void;
}

export function ContextTabBar({
  contexts,
  selectedContext,
  contextResults,
  onSelect,
}: ContextTabBarProps) {
  return (
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
              onClick={() => onSelect(ctx)}
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
  );
}
