"""
Griply CLI

Command-line interface for Griply - Agentic UX Analytics.

Usage:
    griply <url> [options]
    griply --version
    griply --help
"""

import click
import uvicorn
import webbrowser
from pathlib import Path
from . import __version__


@click.command()
@click.argument('url', required=False)
@click.option('--port', default=8080, help='Port to run server on (default: 8080)')
@click.option('--no-browser', is_flag=True, help="Don't open browser automatically")
@click.option('--host', default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
@click.version_option(version=__version__, prog_name='griply')
def main(url, port, no_browser, host):
    """
    Griply - Agentic UX Analytics

    Test your app with AI agents and visualize how they interact with your application.

    Examples:
        griply                              # Start Griply on default port 8080
        griply https://localhost:3000       # Pre-fill URL in the interface
        griply --port 3000                  # Start on custom port
        griply --no-browser                 # Don't open browser automatically
    """

    # Display startup message
    click.echo(f"🚀 Starting Griply v{__version__}")
    click.echo(f"📍 Server running at http://localhost:{port}")

    if url:
        click.echo(f"🎯 Target URL: {url}")
        click.echo("   (URL will be pre-filled in the interface)")

    # Check if static files exist
    static_dir = Path(__file__).parent / "static"
    if not static_dir.exists():
        click.echo()
        click.secho("⚠️  Warning: UI not built yet!", fg="yellow", bold=True)
        click.echo("   Run: cd ui && pnpm install && pnpm build")
        click.echo()

    # Open browser
    if not no_browser:
        browser_url = f"http://localhost:{port}"
        if url:
            # TODO: Add URL as query parameter when UI supports it
            pass
        webbrowser.open(browser_url)
        click.echo(f"🌐 Opening browser at {browser_url}")

    click.echo()
    click.echo("Press Ctrl+C to stop the server")
    click.echo()

    # Start FastAPI server
    try:
        uvicorn.run(
            "griply.server:app",
            host=host,
            port=port,
            reload=False,
            log_level="info"
        )
    except KeyboardInterrupt:
        click.echo("\n\n👋 Griply stopped. Goodbye!")


if __name__ == '__main__':
    main()
