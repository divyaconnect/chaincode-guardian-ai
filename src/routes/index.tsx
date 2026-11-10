import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, FileCode2, Gauge, ScanSearch, ShieldAlert, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-scan.jpg";
import { VULNERABILITIES } from "@/lib/vulnerabilities";
import { severityClasses } from "@/lib/audit-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel.sol — AI-Assisted Smart Contract Vulnerability Detection" },
      {
        name: "description",
        content:
          "Detect reentrancy, overflow, access-control and other smart contract vulnerabilities with a hybrid static + AI security analysis pipeline.",
      },
      { property: "og:title", content: "Sentinel.sol — AI Smart Contract Vulnerability Detection" },
      {
        property: "og:description",
        content: "Hybrid static + AI security analysis for Solidity smart contracts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PIPELINE = [
  {
    icon: FileCode2,
    step: "01",
    title: "Ingest",
    body: "Paste or upload Solidity source. The contract is normalized and line-indexed.",
  },
  {
    icon: ScanSearch,
    step: "02",
    title: "Static pre-scan",
    body: "Rule-based pattern matching flags known SWC signatures instantly in the browser.",
  },
  {
    icon: Brain,
    step: "03",
    title: "AI deep analysis",
    body: "A large language model reasons about control flow, state, and business logic.",
  },
  {
    icon: Gauge,
    step: "04",
    title: "Risk report",
    body: "Findings are ranked by severity with a 0–100 security score and patched code.",
  },
];

const STATS = [
  { value: "$3.8B+", label: "lost to DeFi exploits in 2022" },
  { value: "37+", label: "SWC weakness classes" },
  { value: "<60s", label: "average audit time" },
];

function Index() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroImg}
          alt="Wireframe blockchain blocks being scanned, some highlighted red as vulnerable"
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-24 md:pb-32 md:pt-36">
          <p className="eyebrow mb-6">
            <span className="mr-2 inline-block size-1.5 rounded-full bg-signal animate-blink" />
            Blockchain security research system
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            AI-assisted smart contract{" "}
            <span className="text-gradient-signal">vulnerability detection</span> &amp; security
            analysis.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Smart contracts are immutable once deployed — a single bug can drain millions. Sentinel
            combines rule-based static analysis with large-language-model reasoning to audit
            Solidity code before it ships.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild variant="signal" size="lg">
              <Link to="/analyzer">
                Analyze a contract <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="terminal" size="lg">
              <Link to="/architecture">How it works</Link>
            </Button>
          </div>
          <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-border/60 pt-8">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="font-mono text-2xl font-semibold text-foreground md:text-3xl">
                  {s.value}
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 md:grid-cols-2">
        <div>
          <p className="eyebrow mb-4">The problem</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Code is law — and bugs are permanent.
          </h2>
        </div>
        <div className="space-y-5 text-muted-foreground">
          <p>
            Smart contracts hold real value on public blockchains, yet manual audits are slow,
            expensive, and scarce. Traditional static analyzers catch known patterns but miss
            context-dependent logic flaws and produce many false positives.
          </p>
          <p>
            This system explores how AI can assist auditors: understanding intent, explaining
            exploits in plain language, and proposing secure fixes — while deterministic rules keep
            the analysis grounded.
          </p>
        </div>
      </section>

      {/* Pipeline */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <p className="eyebrow mb-4">Analysis pipeline</p>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Four stages from source code to security verdict.
          </h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
            {PIPELINE.map((p) => (
              <div key={p.step} className="bg-surface p-7">
                <div className="flex items-center justify-between">
                  <p.icon className="size-5 text-signal" />
                  <span className="font-mono text-xs text-muted-foreground">{p.step}</span>
                </div>
                <h3 className="mt-8 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vuln preview */}
      <section className="mx-auto max-w-7xl px-5 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-4">Detection coverage</p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              What the system looks for
            </h2>
          </div>
          <Button asChild variant="terminal">
            <Link to="/vulnerabilities">
              Full catalogue <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VULNERABILITIES.slice(0, 6).map((v) => {
            const s = severityClasses[v.severity];
            return (
              <div
                key={v.name}
                className="group rounded-md border border-border bg-surface p-6 transition-colors hover:border-signal/40"
              >
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider">
                  <span className="text-muted-foreground">{v.swc}</span>
                  <span className={`rounded-sm border px-2 py-0.5 ${s.text} ${s.bg} ${s.border}`}>
                    {v.severity}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{v.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.summary}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-grid">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-5 py-24 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-sm border border-critical/50 bg-critical/15 text-critical">
              <ShieldAlert className="size-6" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Try it on a vulnerable contract.
              </h2>
              <p className="mt-2 text-muted-foreground">
                Load a sample — reentrancy, tx.origin, overflow — and watch the audit unfold.
              </p>
            </div>
          </div>
          <Button asChild variant="signal" size="lg">
            <Link to="/analyzer">
              <Wrench /> Open analyzer
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
