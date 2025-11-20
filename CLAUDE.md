# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Blast.ai** - an Agentic UX Analytics dashboard built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4. The application visualizes how AI agents interact with applications, tracking their behavior, success rates, and failure points. Currently uses mock data for demonstration purposes.

## Development Commands

**Note:** This project uses **pnpm** as the package manager for better performance.

```bash
# Development
pnpm dev             # Start development server (localhost:3000)

# Building
pnpm build           # Build for production

# Production
pnpm start           # Start production server

# Linting
pnpm lint            # Run ESLint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router (React 19.2.0)
- **Styling**: Tailwind CSS 4 with CSS Variables in OKLch color space
- **UI Components**: Radix UI primitives + shadcn/ui ("new-york" style)
- **Theming**: next-themes (light/dark/system modes)
- **Icons**: lucide-react
- **Charts**: recharts
- **Forms**: react-hook-form + zod
- **Notifications**: sonner (toast notifications)

### Project Structure

```
app/
  ├── agent-runs/         # Main dashboard - table view of agent runs
  ├── analytics/          # Analytics dashboard with charts
  ├── replay/             # Replay viewer for individual agent sessions
  ├── layout.tsx          # Root layout with ThemeProvider
  └── globals.css         # Global styles with CSS variables

components/
  ├── agent-runs/         # Agent runs table, filters, modals, mock data
  ├── analytics/          # Analytics charts and mock data
  ├── replay/             # Replay player, timeline, event log
  ├── layout/             # AppLayout, Sidebar (no Header currently)
  ├── ui/                 # 60+ shadcn/ui components
  ├── theme-provider.tsx  # next-themes wrapper
  └── theme-toggle.tsx    # Light/Dark/System theme switcher

lib/
  └── utils.ts            # cn() utility (clsx + tailwind-merge)
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

4. **Path Aliases** (from tsconfig.json):
   - `@/components` → `./components`
   - `@/lib` → `./lib`
   - `@/app` → `./app`
   - `@/` → `./*` (root)

### Pages & Features

1. **Agent Runs** (`/agent-runs`):
   - Table view of agent execution sessions
   - Filters by persona and status
   - Modal for detailed run information
   - Mock data: `components/agent-runs/mock-data.ts`

2. **Analytics** (`/analytics`):
   - Metrics overview cards (completion rate, avg duration, total runs, error rate)
   - Drop-off analysis funnel chart
   - Conversion funnel visualization
   - Error types distribution (pie chart)
   - Persona success comparison (bar chart)
   - Mock data: `components/analytics/mock-data.ts`

3. **Replay** (`/replay`):
   - Replay player for individual agent sessions
   - Timeline visualization
   - Event log with timestamps

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
- Components config: `components.json`

### Important Notes

- No demo/demo mode messaging should be shown in the UI
- All data is currently mocked (no backend/API integration yet)
- TypeScript strict mode is enabled
- HTML has `suppressHydrationWarning` for next-themes hydration
- Don't do any .md or documentation files unless i asked for it