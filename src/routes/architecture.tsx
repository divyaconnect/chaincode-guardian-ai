import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "System Architecture & Methodology — Sentinel.sol" },
      {
        name: "description",
        content:
          "How the AI-assisted smart contract security analysis system works: modules, workflow, scoring model, and limitations.",
      },
      { property: "og:title", content: "System Architecture & Methodology — Sentinel.sol" },
      {
        property: "og:description",
        content: "Modules, workflow, scoring model and limitations of the hybrid static + AI auditor.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArchitecturePage,
});

const LAYERS = [
  {
    name: "Presentation layer",
    items: ["Code editor & file upload", "Sample contract library", "Interactive audit report", "Markdown report export"],
  },
  {
    name: "Static analysis engine",
    items: ["Line-indexed tokenizer", "Regex signature rules (SWC-mapped)", "Compiler version checks", "Instant client-side feedback"],
  },
  {
    name: "AI reasoning engine",
    items: ["LLM with security-auditor prompt", "Strict JSON schema output", "Control-flow & state reasoning", "Patch generation"],
  },
  {
    name: "Risk scoring & reporting",
    items: ["Severity classification (5 levels)", "Confidence per finding", "0–100 security score", "Gas & best-practice advice"],
  },
];

const SCORE = [
  { range: "90–100", label: "Safe", tone: "text-signal" },
  { range: "70–89", label: "Low", tone: "text-low" },
  { range: "50–69", label: "Medium", tone: "text-medium" },
  { range: "25–49", label: "High", tone: "text-high" },
  { range: "0–24", label: "Critical", tone: "text-critical" },
];

const FLOW = `┌──────────────┐    ┌──────────────────┐    ┌───────────────────┐    ┌───────────────┐
│ Solidity src │ ─▶ │  Static pre-scan │ ─▶ │ AI deep analysis  │ ─▶ │  Risk report  │
│  (.sol file) │    │  SWC rule match  │    │ LLM + JSON schema │    │ score + fixes │
└──────────────┘    └──────────────────┘    └───────────────────┘    └───────────────┘
                            │                         ▲
                            └──── signals & context ──┘`;

function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <p className="eyebrow mb-3">Methodology</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">System architecture</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        A hybrid design: deterministic rules give fast, explainable signals; an AI model adds
        contextual reasoning about business logic that pattern matching cannot see.
      </p>

      <pre className="mt-12 overflow-x-auto rounded-md border border-border bg-code p-6 font-mono text-xs leading-6 text-signal">
        {FLOW}
      </pre>

      <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
        {LAYERS.map((l, i) => (
          <div key={l.name} className="bg-surface p-6">
            <p className="font-mono text-xs text-muted-foreground">L{i + 1}</p>
            <h2 className="mt-2 text-lg font-semibold">{l.name}</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {l.items.map((it) => (
                <li key={it} className="flex gap-2">
                  <span className="text-signal">›</span>
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <section className="mt-20 grid gap-12 md:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">Scoring model</p>
          <h2 className="text-2xl font-semibold tracking-tight">Security score bands</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Each finding is weighted by severity and confidence. The overall score maps to a risk
            level shown in the report.
          </p>
          <table className="mt-6 w-full font-mono text-sm">
            <tbody>
              {SCORE.map((s) => (
                <tr key={s.label} className="border-b border-border">
                  <td className="py-3 text-muted-foreground">{s.range}</td>
                  <td className={`py-3 text-right ${s.tone}`}>{s.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="eyebrow mb-3">Limitations</p>
          <h2 className="text-2xl font-semibold tracking-tight">What AI can't guarantee</h2>
          <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground">False positives / negatives.</span> LLMs can miss
              subtle bugs or flag safe code; results are advisory.
            </li>
            <li>
              <span className="text-foreground">No execution.</span> The system does not run
              symbolic execution or fuzzing; pair it with tools like Slither, Mythril or Echidna.
            </li>
            <li>
              <span className="text-foreground">Single-file scope.</span> Imported contracts are
              assumed to behave as their well-known implementations.
            </li>
            <li>
              <span className="text-foreground">Human review.</span> High-value contracts still
              need a professional manual audit before mainnet deployment.
            </li>
          </ul>
        </div>
      </section>

      <div className="mt-20 flex justify-center">
        <Button asChild variant="signal" size="lg">
          <Link to="/analyzer">
            Run the analyzer <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
