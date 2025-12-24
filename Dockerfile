# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/ui
COPY ui/package.json ui/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY ui/ ./
# This builds to ../src/static relative to ui, so /app/src/static
RUN pnpm build

# Stage 2: Build the backend and aggregate
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency files
COPY pyproject.toml uv.lock README.md MANIFEST.in ./

# Install dependencies (frozen to uv.lock)
RUN uv sync --frozen --no-dev --no-install-project

# Copy source and frontend build
COPY src/ src/
COPY --from=frontend-builder /app/ui/out src/static

# Install the project
RUN uv pip install --no-cache-dir .

# Install Playwright browser using the installed playwright
RUN python -m playwright install chromium --with-deps

EXPOSE 8080
ENTRYPOINT []
CMD ["uv", "run", "usefly", "--port", "8080"]
