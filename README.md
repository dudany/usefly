# Griply

Agentic UX Analytics - Test your app with AI agents and visualize how they interact with your application.

## Requirements

- Python 3.12+
- Node.js 18+ with pnpm

## Quick Start

```bash
# 1. Build UI
cd ui
pnpm install
pnpm build

# 2. Install Python package
cd ..
pip install -e .

# 3. Run
python -m uvicorn griply.server:app --port 8080
```

Visit http://localhost:8080

## Development

```bash
# UI dev server (with hot reload)
cd ui && pnpm dev

# Python server
python -m uvicorn griply.server:app --reload --port 8080
```

## License

MIT
