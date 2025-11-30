"""Utility functions for scenario and crawler operations."""

from urllib.parse import unquote
from typing import List, Dict


def decode_url(url: str) -> str:
    """Decode URL-encoded characters to original form."""
    return unquote(url)


def process_urls(urls: List[str]) -> List[Dict[str, str]]:
    """
    Process URLs to store both encoded and decoded versions.
    Removes duplicates based on encoded URL.

    Args:
        urls: List of URLs from browser-use history

    Returns:
        List of dicts with 'url' (encoded) and 'url_decoded' (decoded)
    """
    seen = set()
    result = []

    for url in urls:
        if url not in seen:
            seen.add(url)
            result.append({
                "url": url,
                "url_decoded": decode_url(url)
            })

    return result
