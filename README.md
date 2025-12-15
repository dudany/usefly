# Usefly

AI-powered UX testing platform. Deploy browser agents to simulate real user journeys on your web app and identify friction points, broken flows, and usability issues.

## What It Does

Usefly uses AI browser agents to test your application like a real user would. Create test scenarios, generate tasks automatically, and get detailed reports on where users struggle.

## Requirements

- Python 3.12+
- Node.js 18+ with pnpm

## Quick Start

```bash
# 1. Install
pip install -e .
cd ui && pnpm install && pnpm build && cd ..

# 2. Run
usefly
```

Open http://localhost:8080

## How to Use

1. **Settings** - Configure your OpenAI API key and model settings (Settings → System Settings)
2. **Scenarios** - Create test scenarios with a target URL and description. Generate tasks automatically from your site structure
3. **Runs** - Execute scenarios and watch AI agents interact with your app in real-time
4. **Reports** - View analytics, friction hotspots, and detailed step-by-step agent interactions

## CLI Options

```bash
usefly                 # Start on port 8080
usefly --port 3000     # Custom port
usefly --reload        # Auto-reload for dev
```

## Architecture

- **Backend:** FastAPI (`usefly/`)
- **Frontend:** Next.js React built as static files, served by FastAPI
- **Database:** SQLite (auto-created)
