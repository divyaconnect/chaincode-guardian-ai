export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low", "Info"];

export interface AuditFinding {
  title: string;
  severity: Severity;
  swc: string;
  category: string;
  lines: string;
  description: string;
  impact: string;
  recommendation: string;
  vulnerableSnippet: string;
  fixedSnippet: string;
  confidence: number;
}

export interface AuditReport {
  contractName: string;
  summary: string;
  securityScore: number;
  riskLevel: "Critical" | "High" | "Medium" | "Low" | "Safe";
  findings: AuditFinding[];
  gasOptimizations: string[];
  bestPractices: string[];
}

export type AuditResult =
  | { ok: true; report: AuditReport; model: string; durationMs: number }
  | { ok: false; error: string };

export const severityClasses: Record<Severity, { text: string; bg: string; border: string }> = {
  Critical: { text: "text-critical", bg: "bg-critical/15", border: "border-critical/50" },
  High: { text: "text-high", bg: "bg-high/15", border: "border-high/50" },
  Medium: { text: "text-medium", bg: "bg-medium/15", border: "border-medium/50" },
  Low: { text: "text-low", bg: "bg-low/15", border: "border-low/50" },
  Info: { text: "text-info", bg: "bg-info/15", border: "border-info/50" },
};
