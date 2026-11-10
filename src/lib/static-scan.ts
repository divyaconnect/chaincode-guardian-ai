import type { Severity } from "./audit-types";

/**
 * Lightweight rule-based pre-scan (the "static analysis" stage of the pipeline).
 * Runs instantly in the browser before the AI deep analysis.
 */
export interface StaticRule {
  id: string;
  swc: string;
  title: string;
  severity: Severity;
  test: (line: string) => boolean;
  hint: string;
}

export interface StaticHit {
  ruleId: string;
  swc: string;
  title: string;
  severity: Severity;
  line: number;
  code: string;
  hint: string;
}

export const STATIC_RULES: StaticRule[] = [
  {
    id: "tx-origin",
    swc: "SWC-115",
    title: "Authorization through tx.origin",
    severity: "High",
    test: (l) => /\btx\.origin\b/.test(l),
    hint: "Use msg.sender for authorization checks.",
  },
  {
    id: "low-level-call",
    swc: "SWC-107",
    title: "Low-level call with value (reentrancy risk)",
    severity: "High",
    test: (l) => /\.call\s*(\{[^}]*value|\.value\s*\()/.test(l),
    hint: "Follow checks-effects-interactions or add a ReentrancyGuard.",
  },
  {
    id: "delegatecall",
    swc: "SWC-112",
    title: "delegatecall to potentially untrusted callee",
    severity: "High",
    test: (l) => /\.delegatecall\s*\(/.test(l),
    hint: "Only delegatecall into trusted, immutable implementations.",
  },
  {
    id: "selfdestruct",
    swc: "SWC-106",
    title: "selfdestruct present",
    severity: "Medium",
    test: (l) => /\b(selfdestruct|suicide)\s*\(/.test(l),
    hint: "Protect with strict access control or remove it entirely.",
  },
  {
    id: "timestamp",
    swc: "SWC-116",
    title: "Dependence on block.timestamp",
    severity: "Low",
    test: (l) => /\b(block\.timestamp|now)\b/.test(l) && !/^\s*\/\//.test(l),
    hint: "Miners can skew timestamps slightly; avoid for randomness or tight deadlines.",
  },
  {
    id: "weak-randomness",
    swc: "SWC-120",
    title: "Weak source of randomness",
    severity: "High",
    test: (l) => /(blockhash|block\.difficulty|block\.prevrandao)/.test(l),
    hint: "Use a verifiable randomness oracle such as Chainlink VRF.",
  },
  {
    id: "unchecked-send",
    swc: "SWC-104",
    title: "Unchecked send() return value",
    severity: "Medium",
    test: (l) => /\.send\s*\(/.test(l) && !/(require|if|assert|bool)\s*\(?.*\.send/.test(l),
    hint: "Check the return value or use call with a success check.",
  },
  {
    id: "floating-pragma",
    swc: "SWC-103",
    title: "Floating pragma",
    severity: "Info",
    test: (l) => /pragma\s+solidity\s*\^/.test(l),
    hint: "Lock the compiler version, e.g. pragma solidity 0.8.24;",
  },
  {
    id: "old-compiler",
    swc: "SWC-101",
    title: "Compiler < 0.8 — no built-in overflow checks",
    severity: "Medium",
    test: (l) => /pragma\s+solidity\s*[\^>=<~]*\s*0\.[4-7]\./.test(l),
    hint: "Upgrade to Solidity 0.8+ or use SafeMath.",
  },
];

export function staticScan(source: string): StaticHit[] {
  const hits: StaticHit[] = [];
  const lines = source.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.replace(/\/\/.*$/, "");
    if (!line.trim()) return;
    for (const rule of STATIC_RULES) {
      if (rule.test(line)) {
        hits.push({
          ruleId: rule.id,
          swc: rule.swc,
          title: rule.title,
          severity: rule.severity,
          line: i + 1,
          code: raw.trim(),
          hint: rule.hint,
        });
      }
    }
  });
  return hits;
}
