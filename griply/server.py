"""
Griply FastAPI Server

Serves the static Next.js export and provides API endpoints for agent runs and reports.
"""

from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from typing import Optional

app = FastAPI(title="Griply", description="Agentic UX Analytics")

# Get the static directory path
static_dir = Path(__file__).parent / "static"


# API Routes (placeholder - to be implemented later)
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "griply"}


# Serve static files
if static_dir.exists():
    # Mount _next directory for Next.js assets
    next_dir = static_dir / "_next"
    if next_dir.exists():
        app.mount("/_next", StaticFiles(directory=str(next_dir)), name="next_static")

    # Serve other static files (images, etc.)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """
        Serve static files or fallback to index.html for client-side routing.

        This handles:
        - Direct file requests (e.g., /favicon.ico)
        - Next.js pages (e.g., /reports, /agent-runs)
        - Assets from public directory
        """
        # Handle root path
        if not full_path or full_path == "/":
            index_path = static_dir / "index.html"
            if index_path.exists():
                return HTMLResponse(content=index_path.read_text(), status_code=200)
            raise HTTPException(status_code=404, detail="index.html not found. Please build the UI first.")

        # Try to serve the file directly
        file_path = static_dir / full_path

        # If it's a directory, try index.html
        if file_path.is_dir():
            index_path = file_path / "index.html"
            if index_path.exists():
                return HTMLResponse(content=index_path.read_text(), status_code=200)

        # If it's a file, serve it
        if file_path.is_file():
            return FileResponse(file_path)

        # Try with .html extension
        html_path = static_dir / f"{full_path}.html"
        if html_path.exists():
            return HTMLResponse(content=html_path.read_text(), status_code=200)

        # Fallback to index.html for client-side routing (SPA mode)
        index_path = static_dir / "index.html"
        if index_path.exists():
            return HTMLResponse(content=index_path.read_text(), status_code=200)

        raise HTTPException(status_code=404, detail="File not found")
else:
    # Static directory doesn't exist - show helpful error
    @app.get("/")
    async def no_static():
        return HTMLResponse(
            content="""
            <html>
                <head><title>Griply - Build Required</title></head>
                <body style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto;">
                    <h1>⚠️ Build Required</h1>
                    <p>The UI has not been built yet. Please run:</p>
                    <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px;">cd ui && pnpm install && pnpm build</pre>
                    <p>This will generate the static files in <code>griply/static/</code></p>
                </body>
            </html>
            """,
            status_code=503
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
