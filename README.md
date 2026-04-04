<div align="center">

<br/>

# ⚡ Axon

### _The Intelligence Layer for Your Codebase_

**Axon** turns any GitHub repository into a fully navigable, AI-augmented knowledge system — so developers spend less time deciphering code and more time building great software.

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

<br/>

[**🚀 Live Demo**](#) · [**📸 Screenshots**](#-screenshots) · [**🛠️ Setup**](#%EF%B8%8F-getting-started) · [**💡 Features**](#-features)

</div>

---

## 🧠 The Problem

Every engineering team faces it. A developer joins a new project — or returns after months away — and faces an impenetrable wall of code. Thousands of files, undocumented decisions, rotting TODOs, and no clear onboarding path.

**The average developer wastes 58% of their time just understanding code they didn't write.**

Existing tools like GitHub, GitLens, and Copilot are reactive — they help you _write_ code, but they don't help you _understand_ a codebase at scale.

## ✨ The Solution

**Axon** is a proactive codebase intelligence platform. Connect any public GitHub repository, and Axon instantly:

- **Maps** your codebase with AST-level precision
- **Onboards** new developers in minutes, not days
- **Detects** security vulnerabilities and technical debt — offline, with zero API calls
- **Summarizes** every commit your team has ever pushed, categorized automatically
- **Generates** personal impact statements for every contributor

---

## 🔥 Features

### 🧭 Role-Based Developer Onboarding
> *New hire? Junior dev picking up an unfamiliar service? This is your co-pilot.*

Axon scans the repo structure and generates a **personalized onboarding plan** based on whether you work on the frontend or backend. You get:
- A curated HTML overview of the modules most relevant to your role
- A prioritized task list to get you contributing fast
- ESLint-powered code quality audit built straight into your onboarding checklist

---

### 🛡️ Offline Security & Secrets Scanner (SAST)
> *Because one leaked AWS key can end a company.*

Axon ships with a **zero-API, fully offline Static Application Security Testing (SAST) engine** built directly into the Quality Audit pipeline. No external calls. No rate limits. Just instant results.

It detects:
| Vulnerability | Example |
|---|---|
| AWS Access Keys | `AKIA[0-9A-Z]{16}` |
| GitHub Tokens | `ghp_[a-zA-Z0-9]{36}` |
| Stripe Live Keys | `sk_live_[a-zA-Z0-9]{24}` |
| Hardcoded Passwords | `password = "secret123"` |
| Exposed `.env` files | `.env`, `.env.local` |
| Private Keys | `*.pem`, `id_rsa` |
| Source Map Leaks | `*.map` files in production |

All flagged as **[SECURITY][CRITICAL]** tasks, surfaced at the top of your audit list.

---

### 📡 Smart Updates — Commit Intelligence Feed
> *Stop reading git logs. Start understanding what actually changed.*

Every commit your team pushes is automatically classified using the **[Conventional Commits](https://www.conventionalcommits.org/)** standard — the same specification used by Angular, Vue.js, VS Code, and Vite.

Commits are sorted into five categories:
- 🟢 **New Features** — `feat:` prefixed or feature-adding commits
- 🔵 **Refactors** — structural improvements and code cleanups  
- 🔴 **Fixes & Performance** — `fix:`, `perf:`, hotfixes, rollbacks
- 🟡 **Testing** — test additions and spec updates
- 📄 **Documentation** — README, comments, changelog updates

Each entry shows the **author**, **short SHA**, **date**, and **files modified** — exactly the way GitHub Insights presents it, but filtered and readable.

---

### 🔥 Technical Debt Hotspot Radar
> *Find the files that are silently dragging your team down.*

Axon traverses every file in your repository and computes a **Hotspot Score** based on:
- Cyclomatic complexity of each function
- Density of `TODO` / `FIXME` comments
- Lines of code and nesting depth

The result: a ranked list of your most dangerous files, with AI-generated, **plain-English refactor suggestions** so your team knows exactly what to fix and why.

---

### 🗺️ Architecture Dependency Graph
> *Understand your entire codebase in 30 seconds.*

Axon parses every import, require, and dependency link in your project using **Babel AST** and renders an interactive force-directed graph powered by **Cytoscape.js**. Click any node to explore its connections, contributors, and code context.

---

### 📊 Personal Impact Statement
> *Your commits tell a story. Make sure people can read it.*

Each contributor gets a personal **Impact Dashboard** driven entirely from your local Git data — no OAuth login required. Just type your Git author name, and Axon generates:
- Your total commits & most-touched modules
- A category breakdown of your work (features vs. fixes vs. refactors)
- An auto-generated, resume-ready **impact bullet** describing your contribution

---

### 🤖 AI Pair Programming Mode
> *Like having a senior engineer always available.*

A real-time AI collaboration environment that understands your specific repository. Powered by Gemini, it combines:
- Contextual file lookup from your codebase
- Commit-aware query answering
- Text + audio collaboration for remote pairing sessions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Axon Platform                       │
├──────────────┬──────────────────┬───────────────────────┤
│  React/Vite  │   Node.js/Express│   Python FastAPI      │
│  Frontend    │   Core Backend   │   AI Embeddings       │
│  :5173       │   :3000          │   :5005               │
├──────────────┴──────────────────┴───────────────────────┤
│                     MongoDB Atlas                       │
│   Repos · Commits · Nodes · Tasks · Sessions            │
├─────────────────────────────────────────────────────────┤
│              AI Pair Programming Sub-App                │
│         React :8080  ·  Node.js/Socket.IO :3002         │
└─────────────────────────────────────────────────────────┘
```

**Scan Pipeline:**
```
GitHub Repo URL
     │
     ▼
simple-git clone → Babel AST parse → MongoDB Node storage
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                         Embeddings    Commits      Security
                         (Python)     (Git log)    Scanner
                              │            │            │
                              └────────────┴────────────┘
                                           │
                                     Dashboard UI
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Cytoscape.js |
| **Backend** | Node.js, Express.js, Babel Parser (AST) |
| **AI Engine** | Python FastAPI, HuggingFace Embeddings |
| **Database** | MongoDB (Mongoose ODM) |
| **Code Analysis** | ESLint, simple-git, custom SAST engine |
| **AI Models** | Gemini Flash (Pair Programming), HuggingFace (Embeddings) |
| **Infrastructure** | Docker Compose, Supabase Auth |
| **Pair Mode** | WebRTC, Socket.IO, Gemini API |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ with pip
- MongoDB running locally (or Docker)
- A GitHub Personal Access Token

### 1. Clone the Repository

```bash
git clone https://github.com/YugYadav25/Axon.git
cd Axon
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in your GITHUB_TOKEN, MONGODB_URI, and other keys
```

### 3. Install All Dependencies (one command)

```powershell
# Windows
.\install_all.ps1

# macOS / Linux
chmod +x install_all.sh && ./install_all.sh
```

### 4. Launch All Services

```powershell
# Windows (opens 5 terminal windows automatically)
.\start_all.ps1

# macOS / Linux
chmod +x start_all.sh && ./start_all.sh
```

### 5. Open the App

| Service | URL |
|---|---|
| 🖥️ **Main App** | http://localhost:5173 |
| ⚙️ **Node Backend** | http://localhost:3000 |
| 🧠 **Python AI Backend** | http://localhost:5005 |
| 🤖 **AI Pair UI** | http://localhost:8080 |
| 🔌 **AI Pair Backend** | http://localhost:3002 |

---

## 🐳 Docker Deployment

```bash
docker-compose up -d --build
```

All 5 services spin up automatically with a single command. MongoDB, both backends, and the frontend are fully containerized.

---

## 🗺️ Roadmap

- [ ] **VS Code Extension** — Axon insights directly in your editor
- [ ] **PR-level Security Gates** — Block merges with leaked secrets via GitHub Actions
- [ ] **Team Leaderboard** — Gamified contribution tracking across the org
- [ ] **Self-hosted LLM Support** — Ollama/LM Studio for air-gapped enterprise deployments
- [ ] **Slack / Teams Integration** — Smart Update digests delivered to your team channel
- [ ] **Multi-repo Projects** — Monorepo and microservice architecture support

---

## 🔐 Security

Axon is designed with security-first principles:

- **Prompt Sanitization** — All code snippets are scrubbed of environment variables, API keys, and internal paths before any LLM call
- **Offline SAST** — The security scanner runs entirely locally, no data leaves your machine
- **Zero Secret Storage** — Axon never stores your GitHub token beyond the active session
- **Background Processing** — Large repo scans run asynchronously so no data is exposed in-flight

---

## 🤝 Contributing

We'd love your help making Axon better. To contribute:

1. Fork this repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat: add XYZ"`
4. Open a Pull Request

---

<div align="center">

**Built with ❤️ for developers, by developers.**

*Axon — Because understanding code shouldn't be harder than writing it.*

</div>
