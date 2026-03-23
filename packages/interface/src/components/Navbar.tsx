"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const BTN =
  "flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors cursor-pointer";

function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none" as const,
                userSelect: "none" as const,
              },
            })}
          >
            {!connected ? (
              <button type="button" onClick={openConnectModal} className={BTN}>
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openChainModal}
                  className={BTN + " px-2.5"}
                >
                  {chain.hasIcon && chain.iconUrl && (
                    <img
                      src={chain.iconUrl}
                      alt={chain.name ?? "chain"}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={openAccountModal}
                  className={BTN}
                >
                  {account.displayName}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

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

interface NavLink {
  href: string;
  label: string;
  match: (p: string) => boolean;
  external?: boolean;
}

const MAIN_LINKS: NavLink[] = [
  { href: "/human", label: "human", match: (p) => p === "/human" },
  { href: "/agent", label: "agent", match: (p) => p === "/agent" },
  { href: "/usecases", label: "usecases", match: (p) => p === "/usecases" },
];

const MORE_LINKS: NavLink[] = [
  { href: "/token", label: "$zkb", match: (p) => p === "/token" },
  { href: "/stats", label: "stats", match: (p) => p === "/stats" },
  {
    href: "http://docs.zkbasecred.xyz",
    label: "docs",
    match: (p) => p.startsWith("/docs"),
    external: true,
  },
];

const ALL_LINKS = [...MAIN_LINKS, ...MORE_LINKS];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close menu + dropdown on route change
  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moreOpen]);

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

  const moreIsActive = MORE_LINKS.some((link) => link.match(pathname));

  return (
    <>
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
            <span className="ml-1.5 self-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] md:text-xs font-medium text-amber-600 leading-none">
              beta
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex gap-8 text-4xl font-normal tracking-tight text-muted-foreground">
              {MAIN_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "hover:text-foreground transition-colors lowercase",
                    link.match(pathname) && "text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {/* More dropdown */}
              <div ref={moreRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMoreOpen((prev) => !prev)}
                  className={cn(
                    "flex items-center gap-1 hover:text-foreground transition-colors lowercase cursor-pointer",
                    moreIsActive && "text-foreground",
                  )}
                >
                  more
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      moreOpen && "rotate-180",
                    )}
                  />
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full mt-3 min-w-[160px] rounded-xl border border-border bg-background shadow-lg py-2">
                    {MORE_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block px-5 py-2.5 text-lg font-normal lowercase text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
                          link.match(pathname) && "text-foreground",
                        )}
                        onClick={() => setMoreOpen(false)}
                        {...(link.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <WalletButton />
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
      </nav>

      {/* Mobile menu overlay — outside <nav> for independent stacking context */}
      <div
        className={cn(
          "md:hidden fixed inset-0 top-20 z-50 bg-background border-t border-border transition-all duration-300 ease-in-out",
          menuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none",
        )}
      >
        <div className="flex flex-col gap-6 px-6 pt-8">
          {ALL_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-2xl font-normal tracking-tight lowercase transition-all duration-300",
                link.match(pathname)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
                menuOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2",
              )}
              style={{
                transitionDelay: menuOpen ? `${75 * (i + 1)}ms` : "0ms",
              }}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {link.label}
            </Link>
          ))}
          <div
            className={cn(
              "pt-4 border-t border-border transition-all duration-300",
              menuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2",
            )}
            style={{
              transitionDelay: menuOpen
                ? `${75 * (ALL_LINKS.length + 1)}ms`
                : "0ms",
            }}
          >
            <WalletButton />
          </div>
        </div>
      </div>
    </>
  );
}
