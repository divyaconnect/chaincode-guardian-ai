import { describe, expect, it } from "vitest";
import { staticScan } from "@/lib/static-scan";

const ids = (src: string) => staticScan(src).map((h) => h.ruleId);

describe("static pre-scan rules", () => {
  it("flags tx.origin authorization", () => {
    expect(ids(`require(tx.origin == owner);`)).toContain("tx-origin");
  });

  it("flags low-level call with value as reentrancy risk", () => {
    expect(ids(`(bool ok, ) = msg.sender.call{value: amount}("");`)).toContain("low-level-call");
  });

  it("flags compilers below 0.8 for overflow", () => {
    expect(ids(`pragma solidity ^0.6.12;`)).toContain("old-compiler");
    expect(ids(`pragma solidity 0.8.24;`)).not.toContain("old-compiler");
  });

  it("ignores patterns inside line comments", () => {
    expect(ids(`// tx.origin is dangerous`)).toEqual([]);
  });

  it("reports the correct line number", () => {
    const hits = staticScan(`contract A {\n  function k() external {\n    selfdestruct(payable(msg.sender));\n  }\n}`);
    expect(hits.find((h) => h.ruleId === "selfdestruct")?.line).toBe(3);
  });
});
