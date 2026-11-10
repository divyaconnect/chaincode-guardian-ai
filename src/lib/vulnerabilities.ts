import type { Severity } from "./audit-types";

export interface VulnerabilityClass {
  swc: string;
  name: string;
  severity: Severity;
  summary: string;
  example: string;
  mitigation: string;
  incident?: string;
}

export const VULNERABILITIES: VulnerabilityClass[] = [
  {
    swc: "SWC-107",
    name: "Reentrancy",
    severity: "Critical",
    summary:
      "An external call hands control to an attacker contract, which calls back into the victim before its state is updated.",
    example: `(bool ok,) = msg.sender.call{value: amt}("");\nbalances[msg.sender] = 0; // too late`,
    mitigation: "Checks-Effects-Interactions pattern, ReentrancyGuard, pull-over-push payments.",
    incident: "The DAO hack (2016) — ~3.6M ETH drained.",
  },
  {
    swc: "SWC-101",
    name: "Integer Overflow / Underflow",
    severity: "High",
    summary:
      "Arithmetic wraps around silently in Solidity < 0.8, letting balances jump to huge values or below zero.",
    example: `balanceOf[msg.sender] -= value; // underflows in 0.6.x`,
    mitigation: "Use Solidity ≥ 0.8 (checked math) or SafeMath; review every unchecked block.",
    incident: "BeautyChain (BEC) batchOverflow (2018).",
  },
  {
    swc: "SWC-115",
    name: "Authorization via tx.origin",
    severity: "High",
    summary:
      "tx.origin is the original external account; a phishing contract can make the owner pass the check unknowingly.",
    example: `require(tx.origin == owner);`,
    mitigation: "Always authorize with msg.sender.",
  },
  {
    swc: "SWC-105 / 106",
    name: "Access Control Flaws",
    severity: "Critical",
    summary:
      "Sensitive functions (withdraw, mint, selfdestruct, upgrade) lack proper modifiers, letting anyone call them.",
    example: `function kill() external { selfdestruct(payable(msg.sender)); }`,
    mitigation: "Ownable / AccessControl roles, explicit visibility, two-step ownership transfers.",
    incident: "Parity Multisig freeze (2017) — 513k ETH locked.",
  },
  {
    swc: "SWC-120",
    name: "Weak Randomness",
    severity: "High",
    summary:
      "Block variables like timestamp or prevrandao are predictable or influenceable by validators.",
    example: `uint r = uint(keccak256(abi.encodePacked(block.timestamp)));`,
    mitigation: "Use a verifiable random function (Chainlink VRF) or commit-reveal schemes.",
  },
  {
    swc: "SWC-104",
    name: "Unchecked External Call",
    severity: "Medium",
    summary:
      "send() and low-level call() return false on failure instead of reverting; ignoring it loses funds silently.",
    example: `payable(winner).send(amount); // result ignored`,
    mitigation: "Check return values, prefer call with require(success).",
    incident: "King of the Ether Throne (2016).",
  },
  {
    swc: "SWC-112",
    name: "Delegatecall to Untrusted Callee",
    severity: "Critical",
    summary:
      "delegatecall runs foreign code in the caller's storage context, letting it overwrite owner and balances.",
    example: `impl.delegatecall(msg.data);`,
    mitigation: "Only delegate to trusted, audited implementations; align storage layouts.",
  },
  {
    swc: "SWC-114",
    name: "Front-Running / Transaction Ordering",
    severity: "Medium",
    summary:
      "Pending transactions are public in the mempool, so bots can reorder or sandwich them for profit.",
    example: `function claim(bytes32 answer) external { ... }`,
    mitigation: "Commit-reveal, slippage limits, private mempools, batch auctions.",
  },
  {
    swc: "SWC-128",
    name: "Denial of Service (Gas Limit)",
    severity: "Medium",
    summary:
      "Unbounded loops over growing arrays eventually exceed the block gas limit, bricking the function.",
    example: `for (uint i; i < users.length; i++) pay(users[i]);`,
    mitigation: "Paginate, use pull payments, cap array sizes.",
  },
  {
    swc: "—",
    name: "Oracle / Price Manipulation",
    severity: "Critical",
    summary:
      "Using a single DEX spot price as an oracle lets flash-loan attackers move the price within one transaction.",
    example: `price = reserve1 / reserve0;`,
    mitigation: "TWAP oracles, Chainlink feeds, multiple sources with sanity bounds.",
    incident: "Mango Markets (2022) — ~$114M.",
  },
];
