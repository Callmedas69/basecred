import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-900 hidden md:flex flex-col fixed h-screen">
        <div className="p-6 border-b border-zinc-900">
          <Link href="/" className="font-bold text-4xl tracking-tighter">
            BaseCred
          </Link>
        </div>
        <ScrollArea className="flex-1 py-6">
          <nav className="px-4 space-y-1">
            <DocsLink href="/docs">Overview</DocsLink>
            <DocsLink href="/docs/context-vs-decision">
              Context vs Decision
            </DocsLink>
            <div className="pt-4 pb-2 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Reference
            </div>
            <DocsLink href="/docs/schema">Response Schema</DocsLink>
            <DocsLink href="/docs/availability">Availability</DocsLink>
            <DocsLink href="/docs/time-and-recency">Time & Recency</DocsLink>

            <div className="pt-4 pb-2 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Guides
            </div>
            <DocsLink href="/docs/anti-patterns">Anti-Patterns</DocsLink>
            <DocsLink href="/docs/faq">FAQ</DocsLink>
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        <div className="max-w-4xl mx-auto p-8 lg:p-12">{children}</div>
      </main>
    </div>
  );
}

function DocsLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block px-2 py-1.5 text-sm text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900 rounded-md transition-colors"
    >
      {children}
    </Link>
  );
}
