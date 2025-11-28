#!/bin/bash

echo "🚀 Starting Griply Development Mode"
echo ""
echo "This will start:"
echo "  1. Next.js dev server (UI) on http://localhost:3000"
echo "  2. FastAPI server (backend) on http://localhost:8080"
echo ""
echo "Note: For development, you'll want to:"
echo "  - Terminal 1: cd ui && pnpm dev"
echo "  - Terminal 2: python -m uvicorn griply.server:app --reload --port 8080"
echo ""
echo "Or use the built version:"
echo "  - Run: ./scripts/build.sh"
echo "  - Then: python -m griply.cli"
echo ""

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS - opening two terminal tabs..."

    # Open UI dev server in new terminal tab
    osascript <<EOF
tell application "Terminal"
    activate
    tell application "System Events" to keystroke "t" using {command down}
    do script "cd \"$PROJECT_ROOT/ui\" && pnpm dev" in front window
end tell
EOF

    # Wait a second
    sleep 1

    # Open FastAPI server in new terminal tab
    osascript <<EOF
tell application "Terminal"
    activate
    tell application "System Events" to keystroke "t" using {command down}
    do script "cd \"$PROJECT_ROOT\" && python -m uvicorn griply.server:app --reload --port 8080" in front window
end tell
EOF

    echo "✅ Development servers started in new terminal tabs!"
else
    echo "⚠️  Auto-start only works on macOS."
    echo ""
    echo "Please manually open two terminals and run:"
    echo ""
    echo "Terminal 1:"
    echo "  cd ui && pnpm dev"
    echo ""
    echo "Terminal 2:"
    echo "  python -m uvicorn griply.server:app --reload --port 8080"
fi
