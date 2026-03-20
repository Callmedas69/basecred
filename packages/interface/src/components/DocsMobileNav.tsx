"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const DOCS_LINKS = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/context-vs-decision", label: "Context vs Decision" },
  { section: "Reference" },
  { href: "/docs/schema", label: "Response Schema" },
  { href: "/docs/availability", label: "Availability" },
  { href: "/docs/time-and-recency", label: "Time & Recency" },
  { section: "Guides" },
  { href: "/docs/anti-patterns", label: "Anti-Patterns" },
  { href: "/docs/faq", label: "FAQ" },
] as const;

export function DocsMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground bg-muted/50 border border-border rounded-lg w-full min-h-[44px]"
        aria-expanded={open}
        aria-controls="docs-mobile-drawer"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        Docs Navigation
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        id="docs-mobile-drawer"
        role="dialog"
        aria-label="Documentation navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border transition-transform duration-300 ease-in-out overflow-y-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link
            href="/"
            className="font-bold text-2xl tracking-tighter"
            onClick={() => setOpen(false)}
          >
            BaseCred
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted transition-colors"
            aria-label="Close navigation"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {DOCS_LINKS.map((item, i) => {
            if ("section" in item) {
              return (
                <div
                  key={i}
                  className="pt-4 pb-2 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                >
                  {item.section}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-3 py-2.5 min-h-[44px] flex items-center text-sm rounded-md transition-colors",
                  pathname === item.href
                    ? "text-foreground bg-muted font-medium"
                    : "text-zinc-400 hover:text-foreground hover:bg-muted/50",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
