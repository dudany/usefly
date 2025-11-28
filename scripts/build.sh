#!/bin/bash
set -e

echo "🔨 Building Griply..."
echo ""

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Build UI
echo "📦 Building UI..."
cd ui

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing UI dependencies..."
    pnpm install
fi

# Build the UI
echo "🏗️  Building static export..."
pnpm build

cd "$PROJECT_ROOT"

# Verify build output
if [ -d "griply/static" ]; then
    echo ""
    echo "✅ Build complete!"
    echo "   Static files generated in griply/static/"
    echo ""
    echo "Next steps:"
    echo "  - Run: python -m griply.cli"
    echo "  - Or install: pip install -e ."
else
    echo ""
    echo "❌ Build failed - griply/static/ directory not found"
    exit 1
fi
