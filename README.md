# Usefly

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

**AI-powered UX testing platform.** Deploy browser agents to simulate real user journeys on your web app and identify friction points, broken flows, and usability issues.

<p align="center">
  <img src="ui/public/usefly-logo.png" alt="Usefly Logo" width="120">
</p>

## What It Does

Usefly uses AI browser agents to test your application like a real user would. Instead of writing manual test scripts, you describe what your app does and Usefly generates realistic user tasks, executes them with AI-controlled browsers, and reports back with detailed analytics on where users struggle.

### Key Features

- **Automated Website Analysis** - AI crawls your site to understand its structure, navigation, and available features
- **Smart Task Generation** - Automatically generates realistic user journey tasks based on your site's capabilities
- **AI Browser Agents** - Executes tasks using vision-enabled AI agents that interact with your app like real users
- **Parallel Execution** - Run multiple browser agents simultaneously for faster testing
- **Friction Detection** - Identifies UX issues, confusing flows, and broken functionality
- **Detailed Reports** - View step-by-step agent interactions, screenshots, and success/failure analysis
- **Multi-Provider Support** - Works with OpenAI, Anthropic Claude, Google, and Groq models

## Quick Start

### Prerequisites

- Python 3.12 or higher
- Node.js 18+ with pnpm
- An API key from OpenAI, Anthropic, Google, or Groq

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/usefly.git
cd usefly

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python package
pip install -e .

# Build the UI
cd ui && pnpm install && pnpm build && cd ..

# Start the server
usefly
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### First Run Setup

1. Navigate to **Settings** in the sidebar
2. Configure your AI provider:
   - Select a provider (OpenAI, Claude, Groq, or Google)
   - Enter your API key
   - Choose a model (e.g., `gpt-5.2`, `claude-opus-4.5`)
3. Optionally adjust:
   - **Max Steps** - Maximum actions per task (default: 30)
   - **Max Browser Workers** - Parallel browser count (default: 3)

## Usage

### 1. Create a Scenario

- Go to **Scenarios** → **New Scenario**
- Enter your target URL and a description of your application
- Click **Analyze Website** to let AI understand your site structure
- Generate tasks automatically or add custom ones

### 2. Run Tests

- Select a scenario and click **Run**
- Watch AI agents interact with your app in real-time
- Each agent executes assigned tasks and records every interaction

### 3. View Reports

- Go to **Reports** to see aggregated results
- Analyze friction points and failure patterns
- Review step-by-step screenshots and agent decisions
- Use **Replay** to watch recorded sessions

## CLI Reference

```bash
usefly                    # Start server on default port 8080
usefly --port 3000        # Use custom port
usefly --reload           # Enable auto-reload for development
usefly --help             # Show all options
```

## Architecture

```
usefly/
├── usefly/               # Python backend (FastAPI)
│   ├── cli.py           # CLI entry point
│   ├── server.py        # FastAPI application
│   ├── database.py      # SQLite + SQLAlchemy
│   ├── models/          # Data models & schemas
│   ├── handlers/        # Business logic
│   ├── routers/         # API endpoints
│   ├── prompts/         # AI prompt templates
│   └── static/          # Built UI files
├── ui/                   # Next.js frontend
│   ├── app/             # Pages & routes
│   ├── components/      # React components
│   └── lib/             # Utilities
├── tests/               # Test suite
└── pyproject.toml       # Package configuration
```

### Tech Stack

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [SQLAlchemy](https://www.sqlalchemy.org/) - Database ORM
- [SQLite](https://sqlite.org/) - In process db
- [browser-use](https://github.com/browser-use/browser-use) - AI browser automation
- [LangChain](https://www.langchain.com/) - LLM orchestration

**Frontend:**
- [Next.js](https://nextjs.org/) 16 - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Recharts](https://recharts.org/) - Data visualization

### Supported AI Providers

| Provider | 
|----------|
| OpenAI | 
| Anthropic | 
| Google | 
| Groq | 

## Development

### Running in Development Mode

```bash
# Terminal 1: Backend with auto-reload
source .venv/bin/activate
usefly --reload

# Terminal 2: Frontend dev server (optional, for UI development)
cd ui && pnpm dev
```

### Running Tests

```bash
source .venv/bin/activate
pytest
```

### Building for Production

```bash
# Build optimized UI
cd ui && pnpm build && cd ..

# The static files are automatically served by FastAPI
```

## Troubleshooting

### Common Issues

**"No module named 'usefly'"**
- Make sure you've installed the package: `pip install -e .`
- Ensure your virtual environment is activated

**Browser agents fail to start**
- Check that your API key is correctly configured in Settings
- Ensure you have sufficient API credits

**UI shows blank page**
- Rebuild the UI: `cd ui && pnpm build`
- Clear browser cache and refresh

**Database errors**
- Delete `usefly/data/usefly.db` to reset (this clears all data)
- The database is auto-created on first run

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [browser-use](https://github.com/browser-use/browser-use) - The excellent browser automation library powering our agents
- [LangChain](https://www.langchain.com/) - For seamless LLM integration
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
