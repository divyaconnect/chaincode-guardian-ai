import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AuditResult } from "./audit-types";
import { runTrainedModel } from "./model/classifier.server";

export const auditContract = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        source: z.string().trim().min(20, "Contract is too short").max(200000, "Contract too large"),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<AuditResult> => {
    const started = Date.now();
    try {
      const report = runTrainedModel(data.source);
      return { ok: true, report, durationMs: Date.now() - started };
    } catch (err) {
      console.error("auditContract failed", err);
      return { ok: false, error: "Analysis failed. Please try again." };
    }
  });
