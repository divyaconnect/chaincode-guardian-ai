import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/analyzer", label: "Analyzer" },
  { to: "/vulnerabilities", label: "Vulnerabilities" },
  { to: "/architecture", label: "Architecture" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-sm border border-signal/50 bg-signal-dim text-signal">
            <ShieldCheck className="size-4" />
          </span>
          <span className="font-mono text-sm font-semibold tracking-tight">
            Sentinel<span className="text-signal">.sol</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-sm px-3 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-signal"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Button asChild variant="signal" size="sm">
          <Link to="/analyzer">Scan contract</Link>
        </Button>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.to === "/" }}
            className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground data-[status=active]:text-signal"
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 font-mono text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          Sentinel.sol — AI-Assisted Smart Contract Vulnerability Detection &amp; Security Analysis
          System
        </p>
        <p>Blockchain Technology · Academic Project</p>
      </div>
    </footer>
  );
}
