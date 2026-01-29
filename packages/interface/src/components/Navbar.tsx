"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="w-full px-6 md:px-12 h-20 md:h-24 flex items-center justify-between">
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
          <div className="font-bold text-2xl md:text-5xl tracking-[-0.08em] text-foreground lowercase select-none">
            basecred
          </div>
        </Link>
        <div className="flex gap-4 md:gap-8 text-xl md:text-4xl font-normal tracking-tight text-muted-foreground">
          <Link
            href="/explorer"
            className={cn(
              "hover:text-foreground transition-colors lowercase",
              pathname === "/explorer" ? "text-foreground" : "",
            )}
          >
            explorer
          </Link>
          <Link
            href="http://localhost:4000"
            className={cn(
              "hover:text-foreground transition-colors lowercase",
              pathname.startsWith("/docs") ? "text-foreground" : "",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs
          </Link>
        </div>
      </div>
    </nav>
  );
}
