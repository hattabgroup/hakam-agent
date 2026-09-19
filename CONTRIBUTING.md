# Contributing to Hakam

Thank you for your interest in contributing to Hakam! We are committed to building an open, welcoming, and high-quality automated code review platform.

---

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to `security@hattabgroup.com`.

---

## How Can I Contribute?

- **Reporting Bugs**: Submit clear and reproducible bug reports via [GitHub Issues](https://github.com/hattabgroup/hakam-agent/issues).
- **Proposing Enhancements**: Open a feature request to discuss new capabilities, provider integrations, or rule engines.
- **Improving Documentation**: Fix typos, add examples, or improve setup guides.
- **Submitting Pull Requests**: Implement bug fixes, features, or performance optimizations.

---

## Development Setup

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Node.js](https://nodejs.org/) (v20+) & `npm`
- [Python](https://www.python.org/) (v3.11+)

### 1. Fork & Clone
```bash
git clone https://github.com/<your-username>/hakam-agent.git
cd hakam-agent
```

### 2. Configure Environment
```bash
cp .env.example .env
```
For local development, the default values in `.env.example` are preconfigured to work out of the box with `docker compose`.

### 3. Running Services

#### Option A: Run everything with Docker Compose (Recommended)
```bash
cd infra
docker compose up --build
```
This starts:
- MySQL 8.0 on `localhost:3306`
- Auth Service on `localhost:8001`
- API Service on `localhost:8002`
- MCP Service on `localhost:8003`
- Agent Service (Background Worker)
- Frontend (Next.js) on `http://localhost:3000`

#### Option B: Running Individual Services for Rapid Iteration

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**API Service:**
```bash
cd api-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Auth Service:**
```bash
cd auth-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**MCP Service:**
```bash
cd mcp-service
npm install
npm run dev
```

**Agent Service:**
```bash
cd agent-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.main
```

---

## Coding Standards

### Python (`api-service`, `auth-service`, `agent-service`)
- Follow PEP 8 guidelines.
- Use type annotations wherever practical.
- Keep dependencies minimal and audit new packages for security.

### TypeScript / Next.js (`frontend`, `mcp-service`)
- Ensure TypeScript passes without errors (`npm run build` or `npx tsc --noEmit`).
- Maintain clean, responsive UI with Tailwind CSS.

---

## Pull Request Guidelines

1. **Branch Naming**:
   - Features: `feat/<short-description>`
   - Bugfixes: `fix/<short-description>`
   - Docs: `docs/<short-description>`
2. **Commit Messages**: Write concise, descriptive commit messages.
3. **Keep PRs Focused**: Avoid bundling unrelated changes into a single pull request.
4. **Self-Review**: Test your changes locally before opening a pull request.
5. **No Secrets**: Verify that no private keys, credentials, or `.env` files are included.
