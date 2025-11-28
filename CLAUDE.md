# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Griply** - an Agentic UX Analytics tool built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, and Python (FastAPI). The application visualizes how AI agents interact with applications, tracking their behavior, success rates, and failure points.

The project consists of:
- **UI** (ui/): Next.js 16 frontend with static export
- **Backend** (griply/): Python package with FastAPI server and browser automation agents
- **CLI**: Command-line interface for easy installation and deployment

Currently uses mock data for demonstration purposes - real agent integration coming soon.

## Development Commands

### Quick Start

```bash
# Build and run (production mode)
./scripts/build.sh          # Build UI and prepare static files
python -m griply.cli        # Start Griply server

# Or install as package
pip install -e .
griply                      # Run the CLI
```

### Development Mode

```bash
# UI Development (Next.js dev server)
cd ui
pnpm dev                    # Start at localhost:3000

# Backend Development (FastAPI with reload)
python -m uvicorn griply.server:app --reload --port 8080

# Or use the dev script (macOS only)
./scripts/dev.sh            # Opens both servers in new terminals
```

### Building

```bash
# Build UI only
cd ui
pnpm install
pnpm build                  # Outputs to griply/static/

# Build Python package
pip install -e .            # Install in editable mode
```

## Architecture

### Tech Stack

**Frontend:**
- **Framework**: Next.js 16 with App Router (React 19.2.0) + Static Export
- **Styling**: Tailwind CSS 4 with CSS Variables in OKLch color space
- **UI Components**: Radix UI primitives + shadcn/ui ("new-york" style)
- **Theming**: next-themes (light/dark/system modes)
- **Icons**: lucide-react
- **Charts**: recharts, @nivo/sankey
- **Forms**: react-hook-form + zod
- **Notifications**: sonner (toast notifications)

**Backend:**
- **Server**: FastAPI (Python 3.12+)
- **CLI**: Click
- **Agent**: browser-use, langchain-openai
- **Package Manager**: uv (Python), pnpm (Node.js)

### Project Structure

```
griply/                      # Root directory
├── ui/                      # Next.js frontend
│   ├── app/
│   │   ├── agent-runs/      # Agent runs table view
│   │   ├── metrics/         # Metrics dashboard
│   │   ├── reports/         # Reports dashboard with journey viz
│   │   ├── new-report/      # New report form
│   │   ├── archived/        # Archived pages
│   │   ├── layout.tsx       # Root layout with ThemeProvider
│   │   └── globals.css      # Global styles with CSS variables
│   ├── components/
│   │   ├── agent-runs/      # Agent runs components
│   │   ├── metrics/         # Metrics charts and components
│   │   ├── reports/         # Reports, journey sankey, tables
│   │   ├── layout/          # AppLayout, Sidebar
│   │   ├── providers/       # Website, Segments providers
│   │   ├── ui/              # 56+ shadcn/ui components
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   └── utils.ts         # cn() utility
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   ├── package.json         # Node.js dependencies
│   ├── next.config.mjs      # Next.js config (static export)
│   └── tsconfig.json        # TypeScript config
├── griply/                  # Python package
│   ├── __init__.py          # Package version
│   ├── cli.py               # CLI entry point
│   ├── server.py            # FastAPI server
│   ├── crawler_agent.py     # Website crawler agent
│   ├── task_generator_agent.py  # Task generation
│   ├── prompts/             # Agent prompts
│   │   ├── crawler_v1.txt
│   │   └── task_generator.txt
│   ├── static/              # Built Next.js files (gitignored)
│   └── data/                # Agent session data (gitignored)
├── scripts/
│   ├── build.sh             # Build UI and package
│   └── dev.sh               # Development mode helper
├── pyproject.toml           # Python package config
├── CLAUDE.md                # This file
├── PLAN.md                  # Development roadmap
└── README.md                # Project documentation
```

### Key Architectural Patterns

1. **Layout System**:
   - Fixed sidebar (256px width) with main content offset (`ml-64`)
   - `AppLayout` wraps all main pages (agent-runs, analytics, replay)
   - Sidebar contains navigation + theme toggle at bottom

2. **Theming**:
   - Root layout wraps app with `ThemeProvider` (attribute="class", defaultTheme="system")
   - CSS variables defined in `app/globals.css` for `:root` (light) and `.dark` (dark)
   - OKLch color space for perceptually uniform colors
   - Theme toggle in sidebar footer allows light/dark/system switching

3. **Component Patterns**:
   - All UI components use `class-variance-authority` for variants
   - `cn()` utility merges Tailwind classes (from clsx + tailwind-merge)
   - Client components use `"use client"` directive
   - Mock data lives alongside dashboard components

4. **Path Aliases** (from ui/tsconfig.json):
   - `@/components` → `./components`
   - `@/lib` → `./lib`
   - `@/app` → `./app`
   - `@/` → `./*` (ui/ root)

5. **Deployment**:
   - Next.js static export outputs to `griply/static/`
   - FastAPI serves static files and provides API endpoints
   - CLI wraps FastAPI server with user-friendly interface
   - Package can be installed via pip for easy distribution

### Pages & Features

1. **New Report** (`/new-report`):
   - Form to create new agent test runs
   - Configure personas, test parameters
   - Mock data: TBD

2. **Reports** (`/reports`):
   - Dashboard of completed test runs
   - Journey Sankey diagram visualization
   - Journey table with detailed metrics
   - Mock data: `ui/components/reports/sankey-data.json`

3. **Metrics** (`/metrics`):
   - Metrics overview with chart cards
   - SDK snippets and integration guides
   - Starter pack catalog
   - Mock data: `ui/components/metrics/starter-pack-data.ts`

4. **Agent Runs** (`/agent-runs`):
   - Table view of individual agent execution sessions
   - Filters by persona and status
   - Modal for detailed run information
   - Mock data: `ui/components/agent-runs/mock-data.ts`

**Archived Pages:**
- Analytics (`/analytics`) - Old analytics dashboard
- Replay (`/replay`) - Replay viewer for sessions
- Archived Reports (`/archived/reports`) - Old reports implementation

### Styling Guidelines

- **CSS Variables**: All colors use CSS variables (e.g., `bg-background`, `text-foreground`)
- **Color Palette**: Purple primary (`oklch(0.55 0.2 280)`), neutral grays
- **Responsive**: Mobile-first approach with Tailwind breakpoints (sm:, md:, lg:)
- **Dark Mode**: Uses `.dark` class selector via next-themes
- **Animations**: tw-animate-css package for Tailwind animations

### shadcn/ui Configuration

- Style: "new-york"
- RSC: true
- Base color: neutral
- CSS Variables: true
- Icon library: lucide-react
- Components config: `ui/components.json`

### Python Agent System

The `griply/` directory contains Python code for browser automation:

- **crawler_agent.py**: Website structure crawler using browser-use
- **task_generator_agent.py**: Generates realistic user journey tasks
- **prompts/**: Text files with agent prompt templates
- **data/**: Session data (gitignored) - crawler runs and generated tasks

Agent sessions save structured data:
- Screenshots, URLs, actions, errors, content, models, metadata

### Important Notes

- **No .md files**: Don't create documentation files unless explicitly requested
- **Mock data**: All UI data is currently mocked (no backend integration yet)
- **No demo messaging**: Don't show demo/demo mode messages in the UI
- **TypeScript**: Strict mode enabled
- **Static export**: Next.js configured for static HTML export
- **Package structure**: Can be installed via `pip install -e .` for development
- **CLI**: Run with `griply` command after installation