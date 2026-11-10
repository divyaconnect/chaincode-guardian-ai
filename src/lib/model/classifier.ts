/**
 * Pure inference for the trained Sentinel vulnerability model
 * (TF-IDF unigram+bigram features → one-vs-rest logistic regression).
 * Tokenization mirrors the Python training pipeline exactly; deterministic by design.
 */
import { CATEGORY_INFO, type CategoryId } from "./categories";
import type { ModelReport, ModelFinding, CategoryScore, Severity } from "../audit-types";

export interface TrainedModel {
  version: string;
  dataset: string;
  labels: CategoryId[];
  vocab: string[];
  idf: number[];
  classes: Record<string, { bias: number; threshold: number; weights: number[] }>;
  metrics: Record<string, unknown>;
}

const BLOCK = /\/\*[\s\S]*?\*\//g;
const LINE = /\/\/[^\n]*/g;
const STR = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g;
const NUM = /\b(?:0x[0-9a-fA-F]+|\d[\d_]*(?:\.\d+)?(?:e\d+)?)\b/g;
const TOK =
  /[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*|==|!=|<=|>=|&&|\|\||\+\+|--|\+=|-=|\*=|\/=|=>|[-+*/%<>=!&|^~?:;,(){}[\]]/g;

export function tokenize(src: string): string[] {
  const s = src
    .replace(BLOCK, " ")
    .replace(STR, " STR ")
    .replace(LINE, " ")
    .replace(NUM, " NUM ");
  return augment(s.match(TOK) ?? []);
}

const CALL_SUFFIXES = [".call", ".call.value", ".send", ".transfer", ".delegatecall"];

/** Append structural tokens (order-aware signals a bag-of-ngrams cannot see). Mirrors train.py. */
function augment(toks: string[]): string[] {
  const extra: string[] = [];
  let depth = 0;
  let fnDepth: number | null = null;
  let sawCall = false;
  const n = toks.length;
  for (let i = 0; i < n; i++) {
    const t = toks[i]!;
    if (t === "function") {
      fnDepth = depth;
      sawCall = false;
    } else if (t === "{") {
      depth += 1;
    } else if (t === "}") {
      depth -= 1;
      if (fnDepth !== null && depth <= fnDepth) {
        fnDepth = null;
        sawCall = false;
      }
    }
    if (CALL_SUFFIXES.some((s) => t.endsWith(s))) {
      if (
        t.endsWith(".call.value") ||
        (t.endsWith(".call") && i + 2 < n && toks[i + 1] === "{" && toks[i + 2] === "value")
      ) {
        extra.push("__VALUE_CALL__");
      }
      if (fnDepth !== null) sawCall = true;
    } else if (sawCall && fnDepth !== null) {
      if ((t === "=" || t === "+=" || t === "-=") && i > 0 && toks[i - 1] === "]") {
        extra.push("__WRITE_AFTER_CALL__");
      } else if (t === "+=" || t === "-=" || t === "delete") {
        extra.push("__WRITE_AFTER_CALL__");
      }
    }
  }
  return toks.concat(extra);
}

function ngrams(tokens: string[]): string[] {
  const out = tokens.slice();
  for (let i = 0; i + 1 < tokens.length; i++) out.push(`${tokens[i]} ${tokens[i + 1]}`);
  return out;
}

const vocabCache = new WeakMap<TrainedModel, Map<string, number>>();
function vocabIndex(model: TrainedModel) {
  let m = vocabCache.get(model);
  if (!m) {
    m = new Map(model.vocab.map((t, i) => [t, i]));
    vocabCache.set(model, m);
  }
  return m;
}

/** Sparse L2-normalized TF-IDF vector (sublinear tf), identical to scikit-learn. */
export function vectorize(model: TrainedModel, tokens: string[]): Map<number, number> {
  const index = vocabIndex(model);
  const counts = new Map<number, number>();
  for (const g of ngrams(tokens)) {
    const i = index.get(g);
    if (i !== undefined) counts.set(i, (counts.get(i) ?? 0) + 1);
  }
  const vec = new Map<number, number>();
  let norm = 0;
  for (const [i, c] of counts) {
    const v = (1 + Math.log(c)) * (model.idf[i] ?? 0);
    vec.set(i, v);
    norm += v * v;
  }
  norm = Math.sqrt(norm) || 1;
  for (const [i, v] of vec) vec.set(i, v / norm);
  return vec;
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

const SIGNAL_LABELS: Record<string, string> = {
  __VALUE_CALL__: "⟨ether sent via low-level call⟩",
  __WRITE_AFTER_CALL__: "⟨state written after external call⟩",
  STR: "⟨string⟩",
  NUM: "⟨number⟩",
};

/** Human-readable form of a model feature (unigram or bigram). */
export function describeSignal(term: string): string {
  return term
    .split(" ")
    .map((p) => SIGNAL_LABELS[p] ?? p)
    .join(" ");
}

export function predict(model: TrainedModel, source: string) {
  const tokens = tokenize(source);
  const x = vectorize(model, tokens);
  const out = model.labels.map((label) => {
    const c = model.classes[label]!;
    let z = c.bias;
    const contribs: { term: string; value: number }[] = [];
    for (const [i, v] of x) {
      const w = c.weights[i] ?? 0;
      z += v * w;
      if (w > 0) contribs.push({ term: model.vocab[i]!, value: v * w });
    }
    contribs.sort((a, b) => b.value - a.value || a.term.localeCompare(b.term));
    return {
      label,
      probability: sigmoid(z),
      threshold: c.threshold,
      signals: contribs.slice(0, 6).map((s) => s.term),
    };
  });
  return { tokens: tokens.length, predictions: out };
}

const SEVERITY_WEIGHT: Record<Severity, number> = {
  Critical: 45,
  High: 30,
  Medium: 18,
  Low: 8,
  Info: 0,
};

export function riskFromScore(score: number): ModelReport["riskLevel"] {
  if (score >= 90) return "Safe";
  if (score >= 70) return "Low";
  if (score >= 50) return "Medium";
  if (score >= 25) return "High";
  return "Critical";
}

function evidenceLines(source: string, signals: string[]) {
  const lines = source.split(/\r?\n/);
  const hits: { line: number; code: string }[] = [];
  const seen = new Set<number>();
  for (const raw of signals) {
    if (raw.includes("__WRITE_AFTER_CALL__")) continue;
    if (raw.includes("__VALUE_CALL__")) {
      const i = lines.findIndex(
        (l, k) => !seen.has(k) && /\.call\s*(\{\s*value|\.value)/.test(l.replace(/\/\/.*$/, "")),
      );
      if (i >= 0 && hits.length < 4) {
        seen.add(i);
        hits.push({ line: i + 1, code: lines[i]!.trim() });
      }
      continue;
    }
    // Skip features too generic to localize (pure punctuation / literals).
    if (!/[A-Za-z]{2,}/.test(raw.replace(/\b(STR|NUM)\b/g, ""))) continue;
    const parts = raw.split(" ");
    for (let i = 0; i < lines.length && hits.length < 4; i++) {
      if (seen.has(i)) continue;
      const toks = tokenize(lines[i]!);
      const match =
        parts.length === 1
          ? toks.includes(parts[0]!)
          : toks.some((t, k) => t === parts[0] && toks[k + 1] === parts[1]);
      if (match && toks.length > 1) {
        seen.add(i);
        hits.push({ line: i + 1, code: lines[i]!.trim() });
        break;
      }
    }
  }
  return hits.sort((a, b) => a.line - b.line);
}

export function analyze(model: TrainedModel, source: string): ModelReport {
  const { tokens, predictions } = predict(model, source);

  const categoryScores: CategoryScore[] = predictions.map((p) => ({
    category: p.label,
    title: CATEGORY_INFO[p.label].title,
    probability: round(p.probability),
    threshold: p.threshold,
    detected: p.probability >= p.threshold,
  }));

  const findings: ModelFinding[] = predictions
    .filter((p) => p.probability >= p.threshold)
    .map((p) => {
      const info = CATEGORY_INFO[p.label];
      return {
        category: p.label,
        title: info.title,
        severity: info.severity,
        swc: info.swc,
        probability: round(p.probability),
        threshold: p.threshold,
        description: info.description,
        impact: info.impact,
        recommendation: info.recommendation,
        referencePattern: info.referencePattern,
        signals: p.signals,
        evidence: evidenceLines(source, p.signals),
      };
    })
    .sort(
      (a, b) =>
        SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity] || b.probability - a.probability,
    );

  const penalty = findings.reduce((s, f) => s + SEVERITY_WEIGHT[f.severity] * f.probability, 0);
  const securityScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return {
    modelVersion: model.version,
    securityScore,
    riskLevel: riskFromScore(securityScore),
    tokenCount: tokens,
    findings,
    categoryScores,
  };
}

const round = (n: number) => Math.round(n * 1000) / 1000;
