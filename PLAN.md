# Griply MVP Development Plan

## Project Rules
- No .md files except README.md and this PLAN.md
- Keep code concise, no excessive comments
- No demo/mock data messaging in UI
- Single entry point: `griply <url>` CLI command
- All API endpoints prefixed with `/api/`
- Use existing shadcn/ui components, don't add new ones unless necessary

---

## Phase 1: Project Restructure & Rename

### 1.1 Rename & Cleanup
- [x] Rename project from `blast-ai-demo` to `griply`
- [x] Update `package.json` name to `griply-ui`
- [x] Update all "Blast" / "Griply.ai" references in UI to "Griply"
- [x] Update `CLAUDE.md` with new project name and structure
- [ ] Remove archived components (`components/archived/`)
- [ ] Remove unused mock data files after API integration

### 1.2 New Project Structure
```
griply/
├── ui/                     # React frontend
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── ...
├── griply/                  # Python package
│   ├── __init__.py
│   ├── cli.py              # CLI entry point
│   ├── server.py           # FastAPI server
│   ├── agent/
│   │   ├── crawler.py      # Website structure crawler
│   │   ├── task_generator.py
│   │   └── runner.py       # Browser-use task runner
│   ├── prompts/
│   │   ├── crawler.txt
│   │   └── task_generator.txt
│   └── static/             # Built React files (gitignored, built on install)
├── pyproject.toml          # Python package config
├── README.md
├── PLAN.md
├── LICENSE
└── .gitignore
```

- [x] Create new directory structure
- [x] Move `browsing_agent/` → `griply/`
- [x] Move `browsing_agent/prompts/` → `griply/prompts/`
- [x] Move React app to `ui/` subdirectory
- [x] Update import paths

---

## Phase 2: React UI

### 2.1 Configuration Page (`/` or `/new`)
Main entry point - user configures and starts a test run.

- [ ] **URL Input** - target website/localhost URL
- [ ] **Run Mode Toggle**:
  - Quick scan (1 crawler run, learn site structure)
  - Full test (generate personas + run multiple journeys)
- [ ] **Persona Configuration** (for full test):
  - Persona count slider (5-50)
  - Persona distribution presets (e-commerce, SaaS, content site)
  - Or custom distribution inputs
- [ ] **Advanced Options** (collapsible):
  - Max steps per agent (default: 20)
  - Screenshots enabled (default: true)
  - Vision enabled (default: true)
- [ ] **API Key Input** - OpenAI API key (stored in localStorage, never sent to server logs)
- [ ] **Start Run Button** - POST to `/api/runs`
- [ ] **Run Progress Indicator** - WebSocket or polling for status

### 2.2 Reports Page (`/reports`)
List of completed test runs with summary.

- [ ] **Reports Table**:
  - Run ID / timestamp
  - Target URL
  - Run mode (quick/full)
  - Status (running/completed/failed)
  - Success rate
  - Duration
  - Actions: View details, Delete
- [ ] **Filters**: Status, date range
- [ ] **Click row** → navigate to `/reports/[id]`

### 2.3 Report Detail Page (`/reports/[id]`)
Single report with all data.

- [ ] **Summary Cards**:
  - Total runs / Success / Failed / Anomalies
  - Avg duration
  - Top friction points
- [ ] **Journey Sankey Diagram** (keep existing component):
  - Show flow from entry → various paths → completion/drop-off
  - Color by success/failure
- [ ] **Friction Points Table**:
  - Step, Type, Frequency, Avg duration
- [ ] **Link to Agent Runs** filtered by this report

### 2.4 Agent Runs Page (`/runs`)
Individual agent session details.

- [ ] **Runs Table** (refactor existing):
  - Persona type
  - Status (success/error/anomaly)
  - Journey path (abbreviated)
  - Duration
  - Steps completed
  - Timestamp
- [ ] **Filters**: Persona, Status, Report ID
- [ ] **Run Detail Modal** (keep existing):
  - Full journey path
  - Screenshots carousel
  - Agent thoughts/reasoning
  - Friction points
  - Error details if failed

### 2.5 Layout Updates
- [ ] Update sidebar navigation:
  - New Run (/)
  - Reports (/reports)
  - Runs (/runs)
- [ ] Remove unused nav items (metrics, analytics, replay)
- [ ] Update header/branding to "Griply"

### 2.6 API Integration
- [ ] Create `lib/api.ts` with typed fetch functions:
  - `POST /api/runs` - start new run
  - `GET /api/runs` - list runs
  - `GET /api/runs/:id` - get run detail
  - `GET /api/reports` - list reports
  - `GET /api/reports/:id` - get report with aggregated data
  - `GET /api/status/:jobId` - poll job status
  - `DELETE /api/reports/:id` - delete report
- [ ] Replace all mock data imports with API calls
- [ ] Add loading states and error handling

---

## Phase 3: Python Server

### 3.1 FastAPI Server (`griply/server.py`)
- [x] **Static file serving**: Serve built React from `/static`
- [ ] **API Routes**:
  ```
  POST /api/runs          - Start new run (returns jobId)
  GET  /api/runs          - List all runs
  GET  /api/runs/:id      - Get single run
  GET  /api/reports       - List all reports
  GET  /api/reports/:id   - Get report with aggregated runs
  GET  /api/status/:jobId - Get job status (running/complete/failed)
  DELETE /api/reports/:id - Delete report and its runs
  ```
- [ ] **Data storage**: SQLite database at `~/.griply/griply.db`
- [ ] **File storage**: Screenshots/artifacts at `~/.griply/runs/<run_id>/`

### 3.2 Database Schema
- [ ] **reports** table:
  - id, url, mode, status, created_at, completed_at, config_json
- [ ] **runs** table:
  - id, report_id, persona, status, journey_path, friction_points, duration, screenshots_path, thoughts_json, error, created_at

### 3.3 Agent Integration (`griply/agent/`)
- [ ] **Refactor crawler.py**:
  - Accept URL as parameter
  - Return structured JSON (not save to file)
  - Async function callable from server
- [ ] **Refactor task_generator.py**:
  - Accept crawler output + config as parameters
  - Return list of tasks
  - No file I/O
- [ ] **Create runner.py**:
  - Accept single task
  - Run browser-use agent
  - Capture screenshots, thoughts, actions
  - Return structured result
- [ ] **Create orchestrator.py**:
  - Coordinate: crawl → generate tasks → run tasks in parallel
  - Update database with progress
  - Handle job queue

### 3.4 Background Jobs
- [ ] Use `asyncio` for concurrent agent runs
- [ ] Job status tracking (pending/running/complete/failed)
- [ ] Graceful cancellation support

---

## Phase 4: CLI & Packaging

### 4.1 CLI (`griply/cli.py`)
- [x] **Entry point**: `griply <url> [options]`
- [x] **Options**:
  ```
  griply https://localhost:3000
  griply https://localhost:3000 --mode quick
  griply https://localhost:3000 --mode full --personas 20
  griply https://localhost:3000 --port 8080
  griply --version
  griply --help
  ```
- [x] **Behavior**:
  1. Start FastAPI server on specified port (default 8080)
  2. Open browser to `http://localhost:8080`
  3. If URL provided, pre-fill in UI
  4. If `--mode quick`, start run immediately

### 4.2 Python Package (`pyproject.toml`)
- [x] Configure with setuptools
- [x] Dependencies:
  - fastapi
  - uvicorn
  - browser-use
  - langchain-openai
  - pydantic
  - click (for CLI)
- [x] Entry point: `griply = griply.cli:main`
- [ ] Include built React in package data

### 4.3 Build Process
- [x] **Build script** (`scripts/build.sh`):
  1. `cd ui && pnpm install && pnpm build`
  2. Copy `ui/dist/` → `griply/static/`
- [x] **Dev script** for dev workflow
- [x] **.gitignore**: Ignore `griply/static/` (built artifact)

### 4.4 PyPI Deployment
- [ ] Create `__version__` in `griply/__init__.py`
- [ ] Configure GitHub Action for:
  1. Build React UI
  2. Build Python package
  3. Publish to PyPI on tag push
- [ ] Test with TestPyPI first

---

## Phase 5: Open Source Essentials

### 5.1 Repository Setup
- [ ] **README.md** with:
  - One-liner description
  - Demo GIF/screenshot
  - Quick start (`pip install griply && griply https://localhost:3000`)
  - Features list
  - Configuration options
  - Development setup
  - Contributing section (brief)
  - License
- [ ] **LICENSE** - MIT
- [x] **.gitignore** - Python, Node, IDE files
- [x] **pyproject.toml** - with all metadata (author, description, keywords, URLs)

### 5.2 Development Experience
- [ ] **Makefile** with:
  ```make
  dev-ui      # Start React dev server
  dev-server  # Start Python server with reload
  dev         # Start both
  build       # Build React + Python package
  test        # Run tests
  lint        # Run linters
  ```
- [ ] **.env.example** with required vars (OPENAI_API_KEY)
- [ ] **scripts/setup-dev.sh** - one command dev setup

### 5.3 Quality (minimal for MVP)
- [ ] Basic pytest setup with 2-3 smoke tests
- [ ] ESLint + Prettier for UI (already have)
- [ ] Ruff for Python linting
- [ ] Pre-commit hooks (optional, low priority)

### 5.4 GitHub Setup
- [ ] Issue templates (bug, feature request)
- [ ] PR template (brief)
- [ ] GitHub Action: Build + Test on PR
- [ ] GitHub Action: Publish to PyPI on release tag

---

## Phase 6: Polish & Launch

- [ ] Test full flow: install from PyPI → run → see results
- [ ] Test on macOS, Linux, Windows (WSL)
- [ ] Create demo GIF for README
- [ ] Write initial GitHub release notes
- [ ] Post to: Reddit (r/sideproject, r/webdev), HN, Twitter

---

## Priority Order

**MVP (ship first):**
1. Phase 1 (restructure) ✅ IN PROGRESS
2. Phase 3.1-3.2 (server + db)
3. Phase 2.1 (config page - simplified)
4. Phase 3.3 (agent integration - crawler only for quick mode)
5. Phase 4.1-4.2 (CLI + package basics) ✅ MOSTLY DONE
6. Phase 5.1 (README)

**Then iterate:**
- Phase 2.2-2.4 (reports, runs pages)
- Phase 3.3-3.4 (full test mode with personas)
- Phase 4.3-4.4 (automated builds, PyPI)
- Phase 5.2-5.4 (DX polish)

---

## Current Status

**Last Updated:** 2025-11-28

**Current Phase:** 1.2 - Project Restructure (Migration in Progress)

**Blockers:** None

**Notes:**
- Migration branch created: `migration/griply-restructure`
- Directory restructure complete (ui/ and griply/ subdirectories)
- Name changes complete (package.json, sidebar branding)
- Next.js configured for static export
- FastAPI server and CLI created
- Build and dev scripts created
- CLAUDE.md updated with new structure
- Next: Test the build process and verify everything works
