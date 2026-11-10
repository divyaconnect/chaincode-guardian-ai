import type { Severity } from "../audit-types";

export type CategoryId =
  | "reentrancy"
  | "access-control"
  | "arithmetic"
  | "unchecked-calls"
  | "bad-randomness"
  | "locked-ether"
  | "strict-equality"
  | "uninitialized-storage";

export interface CategoryInfo {
  title: string;
  severity: Severity;
  swc: string;
  slitherDetectors: string[];
  description: string;
  impact: string;
  recommendation: string;
  referencePattern: string;
}

/** Static knowledge attached to each class the model predicts. */
export const CATEGORY_INFO: Record<CategoryId, CategoryInfo> = {
  reentrancy: {
    title: "Reentrancy",
    severity: "Critical",
    swc: "SWC-107",
    slitherDetectors: ["reentrancy-eth", "reentrancy-no-eth"],
    description:
      "State is updated after an external call, so a malicious callee can re-enter the function before balances change.",
    impact: "Repeated withdrawals can drain the contract's funds.",
    recommendation:
      "Apply checks-effects-interactions (update state before external calls) and add a ReentrancyGuard.",
    referencePattern: `balances[msg.sender] = 0;          // effect first
(bool ok, ) = msg.sender.call{value: amount}("");
require(ok, "Transfer failed");    // interaction last`,
  },
  "access-control": {
    title: "Access control weakness",
    severity: "Critical",
    swc: "SWC-105 / 106 / 115",
    slitherDetectors: [
      "arbitrary-send",
      "controlled-delegatecall",
      "tx-origin",
      "unprotected-upgrade",
      "suicidal",
      "delegatecall-loop",
      "backdoor",
    ],
    description:
      "Privileged actions (sending Ether, selfdestruct, delegatecall, upgrades) are reachable by unauthorized callers or rely on tx.origin.",
    impact: "Attackers can steal funds, destroy the contract or take over its logic.",
    recommendation:
      "Restrict privileged functions with onlyOwner / role checks based on msg.sender; never authorize with tx.origin.",
    referencePattern: `modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}`,
  },
  arithmetic: {
    title: "Arithmetic issue",
    severity: "Medium",
    swc: "SWC-101",
    slitherDetectors: ["divide-before-multiply", "incorrect-shift", "tautology"],
    description:
      "Arithmetic ordering or comparisons lose precision or always evaluate the same way (e.g. division before multiplication).",
    impact: "Incorrect amounts, rounding losses or checks that never fail.",
    recommendation: "Multiply before dividing, review shifts and comparisons, use Solidity ≥ 0.8.",
    referencePattern: `// multiply first to keep precision
uint256 fee = amount * feeBps / 10_000;`,
  },
  "unchecked-calls": {
    title: "Unchecked return value",
    severity: "High",
    swc: "SWC-104",
    slitherDetectors: ["unused-return", "unchecked-lowlevel", "unchecked-transfer", "unchecked-send"],
    description:
      "Return values of low-level calls, send() or ERC-20 transfer() are ignored, so failures go unnoticed.",
    impact: "Funds may silently fail to move while the contract assumes success.",
    recommendation: "Check every return value, or use OpenZeppelin SafeERC20 and require(success).",
    referencePattern: `(bool ok, ) = to.call{value: amount}("");
require(ok, "Transfer failed");
token.safeTransfer(to, amount);`,
  },
  "bad-randomness": {
    title: "Weak randomness",
    severity: "High",
    swc: "SWC-120",
    slitherDetectors: ["weak-prng"],
    description:
      "Randomness is derived from block values (timestamp, blockhash, prevrandao) that validators can predict or influence.",
    impact: "Lotteries and games can be gamed by miners/validators or front-runners.",
    recommendation: "Use a verifiable randomness source such as Chainlink VRF or a commit-reveal scheme.",
    referencePattern: `// request randomness from an oracle
uint256 requestId = vrfCoordinator.requestRandomWords(...);`,
  },
  "locked-ether": {
    title: "Locked Ether",
    severity: "Medium",
    swc: "SWC-132",
    slitherDetectors: ["locked-ether"],
    description: "The contract can receive Ether but has no function to withdraw it.",
    impact: "Ether sent to the contract is permanently stuck.",
    recommendation: "Add a protected withdraw function or reject Ether that is not needed.",
    referencePattern: `function withdraw() external onlyOwner {
    payable(owner).transfer(address(this).balance);
}`,
  },
  "strict-equality": {
    title: "Dangerous strict equality",
    severity: "Medium",
    swc: "SWC-132",
    slitherDetectors: ["incorrect-equality"],
    description:
      "Logic depends on an exact balance or timestamp match (==), which an attacker can break by force-sending Ether.",
    impact: "Functions can be locked or bypassed (denial of service).",
    recommendation: "Use >= / <= comparisons and track balances internally.",
    referencePattern: `require(address(this).balance >= target, "Not funded");`,
  },
  "uninitialized-storage": {
    title: "Uninitialized variable",
    severity: "High",
    swc: "SWC-109",
    slitherDetectors: ["uninitialized-state", "uninitialized-local", "uninitialized-storage"],
    description:
      "State, local or storage pointer variables are used before being assigned, defaulting to zero or pointing at slot 0.",
    impact: "Unexpected zero values, or overwritten critical storage such as the owner.",
    recommendation: "Initialize every variable explicitly and mark storage/memory locations clearly.",
    referencePattern: `address public owner = msg.sender;
uint256 local = 0;`,
  },
};
