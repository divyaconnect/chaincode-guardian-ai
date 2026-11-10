import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Download,
  Loader2,
  Play,
  ScanSearch,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auditContract } from "@/lib/audit.functions";
import { SAMPLE_CONTRACTS } from "@/lib/sample-contracts";
import { staticScan } from "@/lib/static-scan";
import {
  SEVERITIES,
  severityClasses,
  type CategoryScore,
  type ModelFinding,
  type ModelReport,
  type Severity,
} from "@/lib/audit-types";

export const Route = createFileRoute("/analyzer")({
  head: () => ({
    meta: [
      { title: "Contract Analyzer — Sentinel.sol" },
      {
        name: "description",
        content:
          "Paste a Solidity smart contract and get a repeatable security audit from a model trained on 44k+ labeled real-world contracts.",
      },
      { property: "og:title", content: "Smart Contract Analyzer — Sentinel.sol" },
      {
        property: "og:description",
        content: "Static pre-scan plus a trained vulnerability classifier for Solidity contracts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyzerPage,
});

function AnalyzerPage() {
  const [source, setSource] = useState(SAMPLE_CONTRACTS[0]!.source);
  const [activeSample, setActiveSample] = useState<string | null>(SAMPLE_CONTRACTS[0]!.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const runAudit = useServerFn(auditContract);

  const staticHits = useMemo(() => staticScan(source), [source]);
  const lineCount = source.split("\n").length;

  const mutation = useMutation({
    mutationFn: (src: string) => runAudit({ data: { source: src } }),
  });

  const result = mutation.data;
  const report = result?.ok ? result.report : null;

  function loadSample(id: string) {
    const s = SAMPLE_CONTRACTS.find((c) => c.id === id);
    if (!s) return;
    setSource(s.source);
    setActiveSample(id);
    mutation.reset();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSource(await f.text());
    setActiveSample(null);
    mutation.reset();
    e.target.value = "";
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="eyebrow mb-3">Analyzer</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Audit a smart contract</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Paste Solidity source or load a sample. The static pre-scan runs as you type; the trained
        vulnerability model runs when you press Analyze — the same contract always gets the same
        result.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {SAMPLE_CONTRACTS.map((s) => (
          <button
            key={s.id}
            onClick={() => loadSample(s.id)}
            className={`rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors ${
              activeSample === s.id
                ? "border-signal bg-signal-dim text-signal"
                : "border-border text-muted-foreground hover:border-signal/50 hover:text-foreground"
            }`}
          >
            {s.name} <span className="opacity-60">· {s.tag}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Editor */}
        <div className="flex flex-col overflow-hidden rounded-md border border-border bg-code">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-critical/70" />
              <span className="size-2 rounded-full bg-medium/70" />
              <span className="size-2 rounded-full bg-signal/70" />
              <span className="ml-2">contract.sol · {lineCount} lines</span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".sol,.txt"
              className="hidden"
              onChange={onFile}
            />
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload /> Upload .sol
            </Button>
          </div>
          <div className="relative flex min-h-[520px] flex-1">
            <pre
              aria-hidden
              className="select-none border-r border-border px-3 py-4 text-right font-mono text-xs leading-6 text-muted-foreground/50"
            >
              {Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}
            </pre>
            <textarea
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setActiveSample(null);
              }}
              spellCheck={false}
              aria-label="Solidity source code"
              className="flex-1 resize-none bg-transparent px-4 py-4 font-mono text-xs leading-6 text-foreground outline-none"
              placeholder="// Paste your Solidity contract here"
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <span className="font-mono text-xs text-muted-foreground">
              {staticHits.length} static signal{staticHits.length === 1 ? "" : "s"}
            </span>
            <Button
              variant="signal"
              onClick={() => mutation.mutate(source)}
              disabled={mutation.isPending || source.trim().length < 20}
            >
              {mutation.isPending ? <Loader2 className="animate-spin" /> : <Play />}
              {mutation.isPending ? "Analyzing…" : "Analyze"}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <StaticPanel hits={staticHits} />
          {mutation.isPending && <ScanningPanel />}
          {result && !result.ok && (
            <div className="rounded-md border border-critical/50 bg-critical/10 p-5 text-sm">
              <p className="flex items-center gap-2 font-semibold text-critical">
                <AlertTriangle className="size-4" /> Analysis failed
              </p>
              <p className="mt-1 text-muted-foreground">{result.error}</p>
            </div>
          )}
          {mutation.isError && (
            <div className="rounded-md border border-critical/50 bg-critical/10 p-5 text-sm text-muted-foreground">
              Could not reach the analysis service. Please try again.
            </div>
          )}
          {report && result?.ok && <ReportPanel report={report} durationMs={result.durationMs} />}
          {!mutation.isPending && !result && (
            <div className="rounded-md border border-dashed border-border p-8 text-center">
              <Cpu className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Press <span className="font-mono text-signal">Analyze</span> to run the trained
                vulnerability model.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const s = severityClasses[severity];
  return (
    <span
      className={`shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${s.text} ${s.bg} ${s.border}`}
    >
      {severity}
    </span>
  );
}

function StaticPanel({ hits }: { hits: ReturnType<typeof staticScan> }) {
  return (
    <section className="rounded-md border border-border bg-surface">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <ScanSearch className="size-4 text-signal" />
        <h2 className="font-mono text-xs uppercase tracking-wider">Stage 1 · Static pre-scan</h2>
      </header>
      {hits.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          No known risky patterns matched by the rule set.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {hits.map((h, i) => (
            <li key={`${h.ruleId}-${h.line}-${i}`} className="flex items-start gap-3 px-5 py-3">
              <SeverityBadge severity={h.severity} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {h.title}{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    · L{h.line} · {h.swc}
                  </span>
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">{h.code}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ScanningPanel() {
  return (
    <section className="relative overflow-hidden rounded-md border border-signal/40 bg-surface p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
        <div className="h-1/3 w-full bg-gradient-to-b from-transparent via-signal/10 to-transparent animate-scan" />
      </div>
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-signal">
        <Loader2 className="size-4 animate-spin" /> Stage 2 · Trained model inference
      </p>
      <ul className="mt-4 space-y-1.5 font-mono text-xs text-muted-foreground">
        <li>› tokenizing source…</li>
        <li>› building TF-IDF feature vector…</li>
        <li>› scoring 8 vulnerability classifiers…</li>
      </ul>
    </section>
  );
}

function scoreTone(score: number) {
  if (score >= 90) return "text-signal";
  if (score >= 70) return "text-low";
  if (score >= 50) return "text-medium";
  if (score >= 25) return "text-high";
  return "text-critical";
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

function toMarkdown(r: ModelReport) {
  const lines = [
    `# Security Audit Report`,
    "",
    `**Model:** ${r.modelVersion} · **Score:** ${r.securityScore}/100 · **Risk:** ${r.riskLevel}`,
    "",
    "## Category probabilities",
    "",
    "| Category | Probability | Threshold | Detected |",
    "|---|---|---|---|",
    ...r.categoryScores.map(
      (c) => `| ${c.title} | ${pct(c.probability)} | ${pct(c.threshold)} | ${c.detected ? "yes" : "no"} |`,
    ),
    "",
    "## Findings",
  ];
  if (r.findings.length === 0) lines.push("", "No vulnerability category exceeded its threshold.");
  r.findings.forEach((f, i) => {
    lines.push(
      "",
      `### ${i + 1}. [${f.severity}] ${f.title} (${f.swc}) — ${pct(f.probability)}`,
      "",
      f.description,
      "",
      `**Impact:** ${f.impact}`,
      "",
      `**Recommendation:** ${f.recommendation}`,
      "",
      `**Model signals:** ${f.signals.join(", ")}`,
      ...(f.evidence.length
        ? ["", "**Evidence lines:**", ...f.evidence.map((e) => `- L${e.line}: \`${e.code}\``)]
        : []),
    );
  });
  return lines.join("\n");
}

function ReportPanel({ report, durationMs }: { report: ModelReport; durationMs: number }) {
  const counts = SEVERITIES.map((s) => ({
    s,
    n: report.findings.filter((f) => f.severity === s).length,
  }));
  const circumference = 2 * Math.PI * 42;

  function download() {
    const blob = new Blob([toMarkdown(report)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel-audit-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-md border border-border bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-signal" />
          <h2 className="font-mono text-xs uppercase tracking-wider">
            Stage 2 · Trained model report
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={download}>
          <Download /> Report
        </Button>
      </header>

      <div className="flex flex-col gap-6 border-b border-border p-5 sm:flex-row sm:items-center">
        <div className="relative size-28 shrink-0">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r="42" className="fill-none stroke-border" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              className={`fill-none stroke-current ${scoreTone(report.securityScore)}`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - report.securityScore / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-mono text-3xl font-semibold ${scoreTone(report.securityScore)}`}>
              {report.securityScore}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Risk <span className={scoreTone(report.securityScore)}>{report.riskLevel}</span> ·{" "}
            {report.findings.length} categor{report.findings.length === 1 ? "y" : "ies"} flagged
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Score = 100 − Σ (severity weight × probability) over flagged categories.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {counts.map(({ s, n }) => (
              <span
                key={s}
                className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] ${
                  n
                    ? `${severityClasses[s].text} ${severityClasses[s].border}`
                    : "border-border text-muted-foreground/50"
                }`}
              >
                {s} {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      <CategoryBars scores={report.categoryScores} />

      {report.findings.length === 0 ? (
        <p className="flex items-center gap-2 border-t border-border px-5 py-5 text-sm text-signal">
          <CheckCircle2 className="size-4" /> No vulnerability category exceeded its detection
          threshold.
        </p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {report.findings.map((f, i) => (
            <FindingItem key={f.category} finding={f} defaultOpen={i === 0} />
          ))}
        </ul>
      )}

      <p className="border-t border-border px-5 py-3 font-mono text-[10px] text-muted-foreground">
        {report.modelVersion} · {report.tokenCount.toLocaleString()} tokens ·{" "}
        {durationMs.toLocaleString()} ms · deterministic — same input, same output.
      </p>
    </section>
  );
}

function CategoryBars({ scores }: { scores: CategoryScore[] }) {
  return (
    <div className="space-y-2.5 p-5">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Classifier probabilities · tick = detection threshold
      </p>
      {scores.map((c) => (
        <div key={c.category} className="grid grid-cols-[150px_1fr_44px] items-center gap-3">
          <span className={`truncate text-xs ${c.detected ? "text-foreground" : "text-muted-foreground"}`}>
            {c.title}
          </span>
          <div className="relative h-2 rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${c.detected ? "bg-critical" : "bg-signal/40"}`}
              style={{ width: pct(c.probability) }}
            />
            <div
              className="absolute -top-0.5 h-3 w-px bg-foreground/70"
              style={{ left: pct(c.threshold) }}
            />
          </div>
          <span
            className={`text-right font-mono text-xs ${c.detected ? "text-critical" : "text-muted-foreground"}`}
          >
            {pct(c.probability)}
          </span>
        </div>
      ))}
    </div>
  );
}

function FindingItem({ finding: f, defaultOpen }: { finding: ModelFinding; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-raised"
        aria-expanded={open}
      >
        <SeverityBadge severity={f.severity} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{f.title}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {f.swc} · probability {pct(f.probability)}
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="space-y-4 px-5 pb-5 text-sm">
          <p className="text-muted-foreground">{f.description}</p>
          <p>
            <span className="font-mono text-xs uppercase tracking-wider text-high">Impact · </span>
            {f.impact}
          </p>
          <p>
            <span className="font-mono text-xs uppercase tracking-wider text-signal">Fix · </span>
            {f.recommendation}
          </p>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Top model signals
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {f.signals.map((s) => (
                <code
                  key={s}
                  className="rounded-sm border border-border bg-code px-1.5 py-0.5 font-mono text-[11px]"
                >
                  {s}
                </code>
              ))}
            </div>
          </div>
          {f.evidence.length > 0 && (
            <div className="overflow-hidden rounded-sm border border-critical/40 bg-code">
              <p className="border-b border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-critical">
                Evidence lines
              </p>
              <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-5">
                {f.evidence.map((e) => `${String(e.line).padStart(3, " ")} │ ${e.code}`).join("\n")}
              </pre>
            </div>
          )}
          <div className="overflow-hidden rounded-sm border border-signal/40 bg-code">
            <p className="border-b border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-signal">
              Reference secure pattern
            </p>
            <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-5">
              {f.referencePattern}
            </pre>
          </div>
        </div>
      )}
    </li>
  );
}
