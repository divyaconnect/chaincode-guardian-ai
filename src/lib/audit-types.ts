export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low", "Info"];

export interface CategoryScore {
  category: string;
  title: string;
  probability: number;
  threshold: number;
  detected: boolean;
}

export interface ModelFinding {
  category: string;
  title: string;
  severity: Severity;
  swc: string;
  probability: number;
  threshold: number;
  description: string;
  impact: string;
  recommendation: string;
  referencePattern: string;
  /** Highest-weighted code features that drove this prediction. */
  signals: string[];
  evidence: { line: number; code: string }[];
}

export interface ModelReport {
  modelVersion: string;
  securityScore: number;
  riskLevel: "Critical" | "High" | "Medium" | "Low" | "Safe";
  tokenCount: number;
  findings: ModelFinding[];
  categoryScores: CategoryScore[];
}

export type AuditResult =
  | { ok: true; report: ModelReport; durationMs: number }
  | { ok: false; error: string };

export const severityClasses: Record<Severity, { text: string; bg: string; border: string }> = {
  Critical: { text: "text-critical", bg: "bg-critical/15", border: "border-critical/50" },
  High: { text: "text-high", bg: "bg-high/15", border: "border-high/50" },
  Medium: { text: "text-medium", bg: "bg-medium/15", border: "border-medium/50" },
  Low: { text: "text-low", bg: "bg-low/15", border: "border-low/50" },
  Info: { text: "text-info", bg: "bg-info/15", border: "border-info/50" },
};
