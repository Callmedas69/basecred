"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-foreground"
    >
      <line
        x1="3"
        y1="6"
        x2="21"
        y2="6"
        className={cn(
          "origin-center transition-transform duration-200",
          open && "translate-y-[6px] rotate-45",
        )}
      />
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        className={cn("transition-opacity duration-200", open && "opacity-0")}
      />
      <line
        x1="3"
        y1="18"
        x2="21"
        y2="18"
        className={cn(
          "origin-center transition-transform duration-200",
          open && "translate-y-[-6px] -rotate-45",
        )}
      />
    </svg>
  );
}

const NAV_LINKS: {
  href: string;
  label: string;
  match: (p: string) => boolean;
  external?: boolean;
}[] = [
  { href: "/explorer", label: "explorer", match: (p) => p === "/explorer" },
  { href: "/agent", label: "agent", match: (p) => p === "/agent" },
  {
    href: "http://docs.zkbasecred.xyz",
    label: "docs",
    match: (p) => p.startsWith("/docs"),
    external: true,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border bg-background md:bg-background/80 backdrop-blur-md">
      <div className="w-full px-6 md:px-12 h-20 md:h-24 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <div className="w-12 h-12 md:w-18 md:h-18 relative">
            <Image
              src="/logo - black.png"
              alt="BaseCred Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="font-bold text-2xl md:text-5xl tracking-[-0.08em] text-foreground select-none">
            zkBasecred
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-8 text-4xl font-normal tracking-tight text-muted-foreground">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "hover:text-foreground transition-colors lowercase",
                  link.match(pathname) && "text-foreground",
                )}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <ConnectButton />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 -mr-2"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-20 z-40 bg-white backdrop-blur-md border-t border-border">
          <div className="flex flex-col gap-6 px-6 pt-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-2xl font-normal tracking-tight lowercase transition-colors",
                  link.match(pathname)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setMenuOpen(false)}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-border">
              <ConnectButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
