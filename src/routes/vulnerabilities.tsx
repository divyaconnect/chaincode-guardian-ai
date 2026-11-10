import { createFileRoute } from "@tanstack/react-router";
import { VULNERABILITIES } from "@/lib/vulnerabilities";
import { severityClasses } from "@/lib/audit-types";

export const Route = createFileRoute("/vulnerabilities")({
  head: () => ({
    meta: [
      { title: "Smart Contract Vulnerability Catalogue — Sentinel.sol" },
      {
        name: "description",
        content:
          "Reference of common Solidity vulnerabilities: reentrancy, overflow, tx.origin, access control, weak randomness and more, with mitigations.",
      },
      { property: "og:title", content: "Smart Contract Vulnerability Catalogue" },
      {
        property: "og:description",
        content: "Common Solidity weaknesses mapped to the SWC registry, with real-world incidents.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VulnerabilitiesPage,
});

function VulnerabilitiesPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <p className="eyebrow mb-3">Knowledge base</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Vulnerability catalogue</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        The weakness classes the system is trained to recognize, mapped to the Smart Contract
        Weakness Classification (SWC) registry.
      </p>

      <div className="mt-14 space-y-4">
        {VULNERABILITIES.map((v, i) => {
          const s = severityClasses[v.severity];
          return (
            <article
              key={v.name}
              className="grid gap-6 rounded-md border border-border bg-surface p-6 md:grid-cols-[220px_1fr_1fr] md:p-8"
            >
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")} · {v.swc}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{v.name}</h2>
                <span
                  className={`mt-3 inline-block rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${s.text} ${s.bg} ${s.border}`}
                >
                  {v.severity}
                </span>
              </div>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">{v.summary}</p>
                <p>
                  <span className="font-mono text-xs uppercase tracking-wider text-signal">
                    Mitigation ·{" "}
                  </span>
                  {v.mitigation}
                </p>
                {v.incident && (
                  <p className="font-mono text-xs text-high">⚠ {v.incident}</p>
                )}
              </div>
              <pre className="overflow-x-auto rounded-sm border border-border bg-code p-4 font-mono text-[11px] leading-5 text-muted-foreground">
                {v.example}
              </pre>
            </article>
          );
        })}
      </div>
    </div>
  );
}
