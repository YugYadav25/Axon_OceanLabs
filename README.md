# Axon - The Intelligence Layer for Your Codebase

**Axon** turns any GitHub repository into a fully navigable, AI-augmented knowledge system — so developers spend less time deciphering code and more time building great software.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Service Ports](#service-ports)
- [Development](#development)
- [Contributing](#contributing)

## Overview

Axon is a proactive codebase intelligence platform that connects to any public GitHub repository and instantly:

- **Map** your codebase with AST-level precision
- **Onboard** new developers in minutes, not days
- **Detect** security vulnerabilities and technical debt — offline, with zero API calls
- **Summarize** every commit your team has pushed, categorized automatically
- **Generate** personal impact statements for every contributor
- **Enable** AI pair programming with full repository context

### The Problem

Every engineering team faces it: a developer joins a new project and encounters an impenetrable wall of code. The average developer wastes 58% of their time just understanding code they didn't write.

Existing tools like GitHub, GitLens, and Copilot are reactive — they help you write code, but don't help you understand a codebase at scale.

---

## Features

### Role-Based Developer Onboarding

New developers and engineers picking up unfamiliar services get a personalized onboarding experience. Axon scans the repository structure and generates an onboarding plan based on role:

- Curated HTML overview of role-relevant modules
- Prioritized task list for contributing quickly
- ESLint-powered code quality audit integrated into checklist

### Offline Security & Secrets Scanner (SAST)

A zero-API, fully offline Static Application Security Testing engine detects:

- AWS Access Keys (`AKIA[0-9A-Z]{16}`)
- GitHub Tokens (`ghp_[a-zA-Z0-9]{36}`)
- Stripe Live Keys (`sk_live_[a-zA-Z0-9]{24}`)
- Hardcoded Passwords
- Exposed `.env` files and configuration
- Private keys (`*.pem`, `id_rsa`)
- Source map leaks (`*.map` in production)

All flagged findings are surfaced at the top of the audit list as `[SECURITY][CRITICAL]`.

### Smart Commit Intelligence Feed

Every commit is automatically classified using the Conventional Commits standard (same as Angular, Vue.js, VS Code, Vite):

- **Features** — `feat:` prefixed commits or feature-adding changes
- **Refactors** — structural improvements and code cleanups
- **Fixes** — `fix:`, `perf:`, hotfixes, rollbacks
- **Tests** — test additions and spec updates
- **Documentation** — README, comments, changelog updates

Each entry displays: author, commit SHA, date, and files modified.

### Technical Debt Hotspot Radar

Identifies at-risk files based on:

- Cyclomatic complexity of functions
- Density of `TODO` and `FIXME` comments
- Lines of code and nesting depth
- AI-generated refactor suggestions in plain English

### Architecture Dependency Graph

Interactive force-directed graph powered by Cytoscape.js:

- Parses every import, require, and dependency using Babel AST
- Click any node to explore connections, contributors, and code context
- Understand entire codebase structure in seconds

### Personal Impact Statement

Each contributor gets an Impact Dashboard from local Git data:

- Total commits and most-touched modules
- Work category breakdown (features, fixes, refactors)
- Auto-generated, resume-ready impact bullets

### AI Pair Programming Mode

Real-time collaboration environment with repository context:

- Contextual file lookup from your codebase
- Commit-aware query answering
- Text and audio collaboration for remote pairing sessions
- Powered by Gemini AI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Cytoscape.js |
| Backend | Node.js, Express.js, Babel Parser (AST) |
| AI Engine | Python FastAPI, HuggingFace Embeddings |
| Database | MongoDB (Mongoose ODM) |
| Code Analysis | ESLint, simple-git, custom SAST engine |
| AI Models | Gemini Flash (Pair Programming), HuggingFace (Embeddings) |
| Infrastructure | Docker Compose, Supabase Auth |
| Pair Programming | WebRTC, Socket.IO, Gemini API |

---

## Project Structure

```
Axon/
├── README.md
├── docker-compose.yml
├── install_all.sh       # Install all dependencies
├── install_all.ps1      # Windows install script
├── start_all.sh         # Start all services
├── start_all.ps1        # Windows start script
├── demo_pr_review.js
├── setup_pr_webhook.js
│
├── axon-frontend/       # Main React application
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── supabaseClient.js
│       ├── components/      # React components
│       ├── pages/           # Page views
│       ├── lib/             # Utilities
│       └── assets/          # Static assets
│
├── axon-backend/        # Node/Express core backend
│   ├── package.json
│   ├── index.js
│   ├── Dockerfile
│   └── src/
│       ├── config/
│       │   └── db.js         # Database configuration
│       ├── controllers/      # Route controllers
│       │   ├── authController.js
│       │   ├── changeController.js
│       │   ├── chatController.js
│       │   ├── docsController.js
│       │   ├── onboardingController.js
│       │   ├── personalBrandingController.js
│       │   ├── repoController.js
│       │   ├── tasksController.js
│       │   ├── testController.js
│       │   └── webhookController.js
│       ├── models/          # Mongoose schemas
│       │   ├── ChatLog.js
│       │   ├── CodeEmbedding.js
│       │   ├── Commit.js
│       │   ├── Diagram.js
│       │   └── ...
│       ├── routes/          # API routes
│       ├── services/        # Business logic
│       └── utils/           # Shared utilities
│
├── axon-python-backend/ # Python AI & embeddings
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app/
│       ├── main.py
│       └── routes/
│
└── ai-pair-programming/ # Pair programming sub-app
    ├── Backend/
    │   ├── package.json
    │   ├── Dockerfile
    │   └── src/
    │       ├── audiocall-server.js
    │       ├── github_ai_assistant.py
    │       ├── analyzeRepoRoute.js
    │       └── new.js
    │
    └── Frontend/
        ├── package.json
        ├── vite.config.ts
        ├── Dockerfile
        ├── nginx.conf
        └── src/
            ├── App.tsx
            ├── main.tsx
            ├── components/
            ├── pages/
            ├── hooks/
            ├── lib/
            └── assets/
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ with pip
- **MongoDB** running locally or Docker
- **GitHub Personal Access Token**

### Installation

#### Option 1: Automatic Installation (Recommended)

```bash
# macOS / Linux
chmod +x install_all.sh
./install_all.sh

# Windows
.\install_all.ps1
```

This script installs all dependencies across all five services automatically.

#### Option 2: Manual Installation

```bash
# Install axon-frontend
cd axon-frontend
npm install

# Install axon-backend
cd ../axon-backend
npm install

# Install axon-python-backend
cd ../axon-python-backend
pip install -r requirements.txt

# Install AI pair programming components
cd ../ai-pair-programming/Backend
npm install

cd ../Frontend
npm install
```

### Configuration

```bash
# Create environment file in axon-backend
cp .env.example .env

# Required variables:
# GITHUB_TOKEN=your_github_token
# MONGODB_URI=mongodb://localhost:27017/axon
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_key
# GEMINI_API_KEY=your_gemini_api_key
```

### Running Services

#### Option 1: All Services at Once

```bash
# macOS / Linux
chmod +x start_all.sh
./start_all.sh

# Windows
.\start_all.ps1
```

#### Option 2: Docker Compose

```bash
docker-compose up -d --build
```

#### Option 3: Start Services Individually

```bash
# Terminal 1: mongod
mongod

# Terminal 2: Python backend
cd axon-python-backend
python app/main.py

# Terminal 3: Node backend
cd axon-backend
npm start

# Terminal 4: Frontend
cd axon-frontend
npm run dev

# Terminal 5: AI Pair (Backend)
cd ai-pair-programming/Backend
npm start

# Terminal 6: AI Pair (Frontend)
cd ai-pair-programming/Frontend
npm run dev
```

---

## Service Ports

| Service | Port | URL |
|---|---|---|
| Axon Frontend | 5173 | http://localhost:5173 |
| Axon Node Backend | 3000 | http://localhost:3000 |
| Axon Python Backend | 5005 | http://localhost:5005 |
| AI Pair Frontend | 8080 | http://localhost:8080 |
| AI Pair Backend | 3002 | http://localhost:3002 |
| MongoDB | 27017 | mongodb://localhost:27017 |

---

## Architecture Overview

### System Architecture

The Axon platform consists of five integrated microservices:

```
User Browser
    │
    ├─→ axon-frontend (React/Vite on :5173)
    │       │
    │       └─→ axon-backend (Node/Express on :3000)
    │               │
    │               ├─→ MongoDB (Data Layer)
    │               │
    │               └─→ axon-python-backend (FastAPI on :5005)
    │                   └─→ AI Embeddings & Processing
    │
    └─→ ai-pair-programming-frontend (React/TS on :8080)
            │
            └─→ ai-pair-programming-backend (Node/Express on :3002)
                ├─→ Gemini API (AI Pairing)
                └─→ WebRTC (Audio/Video)
```

### Scan Pipeline

```
GitHub Repository URL
    │
    ▼
Clone via simple-git
    │
    ▼
Parse with Babel AST
    │
    ├─→ Store Nodes in MongoDB
    │
    ├─→ Generate Embeddings (Python)
    │
    ├─→ Extract Commits (Git Log)
    │
    ├─→ Run Security Scanner (SAST)
    │
    └─→ Compute Hotspot Scores
    │
    ▼
Frontend Dashboard & Visualizations
```

---

### Running Development Servers

#### Frontend Development

```bash
cd axon-frontend
npm run dev
```

Starts Vite dev server with hot module reloading at http://localhost:5173

#### Backend Development

```bash
cd axon-backend
npm start
```

Runs the Node/Express server with nodemon auto-reload at http://localhost:3000

#### Python Backend Development

```bash
cd axon-python-backend
python app/main.py
```

Starts the FastAPI server with auto-reload at http://localhost:5005

### Database

Axon uses MongoDB to store:

- Repository metadata and scan results
- AST nodes and code embeddings
- Commit history and classification
- User sessions and tasks
- Chat logs and pair programming sessions

#### Initialize MongoDB

```bash
# If using Docker
docker run -d -p 27017:27017 --name axon-mongo mongo:latest

# If using MongoDB locally
brew services start mongodb-community
```

### Code Quality

```bash
# Run ESLint on frontend
cd axon-frontend
npm run lint

# Run ESLint on backends
cd axon-backend
npm run lint
```

### Build for Production

```bash
# Frontend
cd axon-frontend
npm run build

# Backends
cd axon-backend
npm run build

cd axon-python-backend
pip install -r requirements.txt
```

---

## API Endpoints

### Core Backend (Node.js on :3000)

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | User authentication |
| `/api/repos` | GET, POST | Repository management |
| `/api/repos/:id/scan` | POST | Trigger repository scan |
| `/api/repos/:id/commits` | GET | Get commit history |
| `/api/repos/:id/hotspots` | GET | Get technical debt hotspots |
| `/api/repos/:id/security` | GET | Get security scan results |
| `/api/repos/:id/graph` | GET | Get dependency graph |
| `/api/tasks` | GET, POST | Task management |
| `/api/chat` | POST | Chat completions |
| `/api/webhooks` | POST | GitHub webhook handler |

### Python Backend (FastAPI on :5005)

| Route | Method | Purpose |
|---|---|---|
| `/embeddings/generate` | POST | Generate code embeddings |
| `/embeddings/search` | POST | Semantic code search |
| `/analyze` | POST | Code analysis and suggestions |

### AI Pair Programming (Node.js on :3002)

| Route | Method | Purpose |
|---|---|---|
| `/api/session/create` | POST | Create pair session |
| `/api/session/:id` | GET | Get session details |
| `/api/chat/message` | POST | Send message in session |
| `/api/analysis/repo` | POST | Analyze repository context |

---

## Troubleshooting

### Connection Errors

**Problem**: Cannot connect to MongoDB
```bash
# Check if MongoDB is running
mongosh --version
# or
mongo --version

# Verify connection string in .env
# Should be: mongodb://localhost:27017/axon
```

**Problem**: Port already in use
```bash
# Find and kill process using port
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5005 | xargs kill -9  # Python
```

### Missing Dependencies

```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install

# For Python, upgrade pip
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Environment Variables

Ensure all required environment variables are set in `.env`:

```bash
# Check what's missing
cat .env
# Should contain:
# GITHUB_TOKEN
# MONGODB_URI
# SUPABASE_URL
# SUPABASE_KEY
# GEMINI_API_KEY
```

---

## Roadmap

### Current Version
- Repository scanning and dependency graphing
- Security vulnerability detection
- Commit classification
- Personal impact dashboard
- Technical debt hotspot detection

### Planned Features

- **VS Code Extension** — Axon insights directly in your editor
- **PR-level Security Gates** — Block merges with leaked secrets via GitHub Actions
- **Team Leaderboard** — Gamified contribution tracking across the organization
- **Self-hosted LLM Support** — Ollama/LM Studio for air-gapped enterprise deployments
- **Slack/Teams Integration** — Smart update digests delivered to team channels
- **Multi-repo Projects** — Full monorepo and microservice architecture support
- **Real-time Collaboration** — Enhanced pair programming with live code sharing
- **Custom Rules Engine** — Define security and quality rules per organization

---

## Security

Axon is designed with security-first principles:

- **Prompt Sanitization** — All code snippets are scrubbed of environment variables, API keys, and internal paths before any LLM call
- **Offline SAST** — The security scanner runs entirely locally; no data leaves your machine
- **Zero Secret Storage** — Axon never stores your GitHub token beyond the active session
- **Background Processing** — Large repository scans run asynchronously to prevent data exposure
- **No External API Calls** — Security scanning is 100% offline and doesn't depend on external services

### Reporting Security Issues

If you discover a security vulnerability, please email security@axon-labs.dev instead of using the public issue tracker.

---

## Contributing

We welcome contributions! To get started:

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/Axon.git`
3. Create a feature branch: `git checkout -b feat/your-feature`
4. Set up the development environment: `./install_all.sh`
5. Start all services: `./start_all.sh`

### Making Changes

- Follow the existing code style
- Write meaningful commit messages using Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Test your changes locally before submitting
- Include tests for new features when possible

### Submitting a Pull Request

1. Push your changes to your fork
2. Create a Pull Request with a clear description
3. Link any related issues
4. Wait for code review
5. Address any feedback and update your PR

### Code Style Guide

- **JavaScript/TypeScript**: Use ESLint configuration from the project
- **Python**: Follow PEP 8 standards
- **Commit Messages**: Use Conventional Commits format
- **Variable Naming**: Descriptive names in camelCase (JS/TS) or snake_case (Python)

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Support

- **Documentation**: Check the [docs/](docs/) folder for detailed guides
- **Issues**: Report bugs on the [GitHub Issues](https://github.com/YugYadav25/Axon/issues) page
- **Discussions**: Join our community discussions for feature requests and questions

---

## Authors

**Axon** was built with dedication by the team at OceanLabs.

- **Lead Developer**: Yug Yadav (@YugYadav25)

---

**Built with ❤️ for developers, by developers.**

*Axon — Because understanding code shouldn't be harder than writing it.*
