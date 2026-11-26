<div align="center">

# 🛡️ `sentinel.sol`

### **AI-Assisted Smart Contract Vulnerability Detection & Security Analysis**
**Enhanced with Dual-Space Anomaly Detection via Von Neumann Entanglement Entropy**

[![License: MIT](https://img.shields.io/badge/License-MIT-blueviolet.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-TanStack%20Start-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://tanstack.com/start)
[![Bun](https://img.shields.io/badge/Runtime-Bun-fbf0df?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-Deep%20Learning-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![PennyLane](https://img.shields.io/badge/PennyLane-Quantum%20ML-00D4AA?style=for-the-badge&logo=pennylane&logoColor=black)](https://pennylane.ai)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%26%20Drizzle-3ECF8E?style=for-the-badge&logo=supabase&logoColor=black)](https://supabase.com)

</div>

---

## 🌟 Overview

**`sentinel.sol`** is an AI-assisted smart contract vulnerability detection and security analysis platform for Solidity. It pairs a **TanStack Start + TypeScript + Bun** web workspace and **Supabase / Drizzle ORM** persistence layer with a **Python (`ml/`)** analysis engine powered by **PyTorch** and **PennyLane**.

To catch subtle security flaws that single-view heuristics miss, `sentinel.sol` uses **Dual-Space Anomaly Detection via Von Neumann Entanglement Entropy**—analyzing contract representations across complementary feature/state spaces and measuring cross-space entanglement entropy to flag structural or behavioral anomalies for deeper AI triage and remediation guidance.

---

## ✨ Key Capabilities

*   **🔍 Smart Contract Security Analysis:** Inspects Solidity (`.sol`) contracts for high-risk patterns such as reentrancy, access control issues, unchecked external calls, state/logic anomalies, and denial-of-service vectors.
*   **⚛️ Dual-Space Anomaly Detection (Von Neumann Entanglement Entropy):** Evaluates representations across dual spaces in `ml/` using **PyTorch** and **PennyLane**, computing Von Neumann entanglement entropy to surface high-anomaly regions and cross-space discrepancies.
*   **🤖 AI-Assisted Triage & Remediation:** Combines model anomaly signals with LLM-guided reasoning to explain potential exploit paths, rank severity, and suggest fixes.
*   **🗄️ Persistent Audit Tracking:** Stores scans, findings, and audit history in PostgreSQL via **Drizzle ORM** and **Supabase**.
*   **🧪 Tested & Structured Tooling:** Includes test setup with **Vitest**, code formatting/linting with **Prettier** and **ESLint**, and project conventions in `AGENTS.md`.

---

## 🏗️ Architecture & Dual-Space Flow

```text
  Solidity Contract (.sol)
             │
             ▼
  ┌──────────────────────────┐
  │  TanStack Start UI & API │  (TypeScript + Bun + Supabase/Drizzle)
  └─────────────┬────────────┘
                │
                ▼
  ┌────────────────────────────────────────────────────────┐
  │               Python Analysis Engine (ml/)             │
  │                                                        │
  │   [Space A Representation] ──┐                         │
  │                              ├──► PyTorch + PennyLane  │
  │   [Space B Representation] ──┘    Von Neumann Entropy  │
  └────────────────────────────┬───────────────────────────┘
                               │
                               ▼
  ┌────────────────────────────────────────────────────────┐
  │  Anomaly Scoring, AI Triage & Remediation Report       │
  └────────────────────────────────────────────────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend & App Framework** | TypeScript, React, TanStack Start, Vite |
| **Runtime & Package Manager** | Bun |
| **Database & Persistence** | Supabase (PostgreSQL), Drizzle ORM |
| **ML & Quantum-Enhanced Engine** | Python, PyTorch, PennyLane (`ml/`) |
| **Testing & Quality** | Vitest, ESLint, Prettier |

---

## 📁 Repository Layout

```text
sentinel.sol/
├── drizzle/              # Drizzle ORM schema and database migrations
├── ml/                   # Python ML models, PyTorch & PennyLane dual-space entropy engine
├── public/               # Static assets
├── src/                  # TanStack Start routes, UI components, and server logic
├── supabase/             # Supabase configuration and database setup
├── AGENTS.md             # Agent guidelines and repository conventions
├── package.json          # App scripts and TypeScript/Bun dependencies
├── vitest.config.ts      # Vitest test runner configuration
└── README.md
```

---

## 🚀 Getting Started

### 1. Install App Dependencies (Bun)
```bash
git clone [https://github.com/](https://github.com/)<your-username>/sentinel.sol.git
cd sentinel.sol
bun install
```

### 2. Set Up the Python ML Environment (`PyTorch` & `PennyLane`)
```bash
cd ml
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install torch pennylane numpy
```
*(Install any additional requirements listed inside `ml/` if present.)*

### 3. Configure Environment Variables
Remove any committed `.env` from Git history/tracking (`git rm --cached .env`), keep `.env` in `.gitignore`, and configure your local `.env` with your database, Supabase, AI/ML, and Python runner settings.

### 4. Push Database Schema & Run Dev Server
```bash
bunx drizzle-kit push
bun run dev
```

---

## ⚠️ Security & Responsible Use

`sentinel.sol` is a **security analysis and anomaly-triage aid**, not a guarantee of contract safety or a replacement for a full manual security audit and formal verification before deploying smart contracts to mainnet.

---

## 📄 License

This project is licensed under the **MIT License** — see the `LICENSE` file for details.
