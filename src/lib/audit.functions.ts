import { createServerFn } from "@tanstack/react-start";
import { GatewayError, generateResponse } from "@lovable.dev/ai-gateway";
import { z } from "zod";
import type { AuditReport, AuditResult } from "./audit-types";

const MODEL = "openai/gpt-6-astra" as const;

const severityEnum = ["Critical", "High", "Medium", "Low", "Info"];

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "contractName",
    "summary",
    "securityScore",
    "riskLevel",
    "findings",
    "gasOptimizations",
    "bestPractices",
  ],
  properties: {
    contractName: { type: "string" },
    summary: { type: "string", description: "2-3 sentence executive summary of the audit." },
    securityScore: {
      type: "integer",
      description: "0 (catastrophic) to 100 (no meaningful issues).",
    },
    riskLevel: { type: "string", enum: ["Critical", "High", "Medium", "Low", "Safe"] },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "severity",
          "swc",
          "category",
          "lines",
          "description",
          "impact",
          "recommendation",
          "vulnerableSnippet",
          "fixedSnippet",
          "confidence",
        ],
        properties: {
          title: { type: "string" },
          severity: { type: "string", enum: severityEnum },
          swc: { type: "string", description: "SWC registry id like SWC-107, or 'N/A'." },
          category: { type: "string" },
          lines: { type: "string", description: "Affected line numbers, e.g. '14-18'." },
          description: { type: "string" },
          impact: { type: "string" },
          recommendation: { type: "string" },
          vulnerableSnippet: { type: "string" },
          fixedSnippet: { type: "string" },
          confidence: { type: "integer", description: "0-100 confidence in this finding." },
        },
      },
    },
    gasOptimizations: { type: "array", items: { type: "string" } },
    bestPractices: { type: "array", items: { type: "string" } },
  },
} as const;

const SYSTEM_PROMPT = `You are an expert smart contract security auditor (Solidity / EVM).
Perform a thorough security audit of the provided contract. Detect vulnerabilities such as
reentrancy, integer overflow/underflow, access control flaws, tx.origin authorization,
unchecked external calls, delegatecall misuse, weak randomness, timestamp dependence,
front-running, denial of service, oracle manipulation, and logic errors.
Map each finding to the SWC registry where possible. Reference line numbers from the numbered source.
Only report real issues; do not invent findings for secure code. Order findings by severity.
Provide concrete fixed code snippets. Keep snippets short (under 15 lines).
Score: 90-100 safe, 70-89 low risk, 50-69 medium, 25-49 high, 0-24 critical.`;

export const auditContract = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        source: z.string().trim().min(20, "Contract is too short").max(40000, "Contract too large"),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<AuditResult> => {
    const numbered = data.source
      .split(/\r?\n/)
      .map((l, i) => `${String(i + 1).padStart(3, " ")} | ${l}`)
      .join("\n");

    const started = Date.now();
    try {
      const response = await generateResponse({
        model: MODEL,
        instructions: SYSTEM_PROMPT,
        input: [
          {
            role: "user",
            content: `Audit this smart contract and return JSON matching the schema.\n\n${numbered}`,
          },
        ],
        reasoning: { effort: "low" },
        text: {
          format: {
            type: "json_schema",
            name: "audit_report",
            strict: true,
            schema: reportSchema as unknown as Record<string, unknown>,
          },
        },
      });

      let text = "";
      for (const item of response.output ?? []) {
        if (item.type === "message") {
          for (const part of item.content) {
            if (part.type === "output_text") text += part.text;
            if (part.type === "refusal") {
              return { ok: false, error: "The AI declined to analyze this input." };
            }
          }
        }
      }
      if (!text) return { ok: false, error: "The AI returned an empty report. Please try again." };

      const report = JSON.parse(text) as AuditReport;
      report.securityScore = Math.max(0, Math.min(100, Math.round(report.securityScore)));
      return { ok: true, report, model: MODEL, durationMs: Date.now() - started };
    } catch (err) {
      console.error("auditContract failed", err);
      if (err instanceof GatewayError) {
        if (err.httpStatus === 429)
          return { ok: false, error: "Too many requests right now. Please wait a moment and retry." };
        if (err.httpStatus === 402)
          return { ok: false, error: "AI credits are exhausted for this workspace." };
      }
      return { ok: false, error: "Analysis failed. Please try again." };
    }
  });
