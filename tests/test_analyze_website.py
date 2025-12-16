"""Tests for website analysis endpoint."""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime
from src.models import CrawlerAnalysisRequest


@pytest.mark.asyncio
async def test_analyze_website_success(mock_system_config, mock_agent_history, test_db):
    """Test successful website analysis."""

    # Mock the required dependencies and functions
    with patch('src.handlers.scenarios.get_db') as mock_get_db, \
         patch('src.handlers.scenarios.Agent') as mock_agent_class, \
         patch('src.handlers.scenarios.ChatOpenAI') as mock_llm_class, \
         patch('src.handlers.scenarios.process_urls') as mock_process_urls, \
         patch('src.handlers.scenarios.generate_tasks') as mock_task_gen, \
         patch('builtins.open'):

        # Setup mocks
        mock_get_db.return_value = test_db
        mock_llm_class.return_value = MagicMock()
        mock_agent = AsyncMock()
        mock_agent.run.return_value = mock_agent_history
        mock_agent_class.return_value = mock_agent

        # Mock URL processing
        mock_process_urls.return_value = [
            {"url": "https://example.com", "url_decoded": "https://example.com"},
            {"url": "https://example.com/about", "url_decoded": "https://example.com/about"}
        ]

        # Mock task generation
        mock_task_list = MagicMock()
        mock_task_list.total_tasks = 2
        mock_task_list.tasks = [
            MagicMock(persona="user", dict=lambda: {"persona": "user", "name": "Task 1"}),
            MagicMock(persona="admin", dict=lambda: {"persona": "admin", "name": "Task 2"})
        ]
        mock_task_gen.return_value = mock_task_list

        # Create request
        request = CrawlerAnalysisRequest(
            website_url="https://example.com",
            name="Test Site",
            description="Test description",
            metrics=["performance"],
            email="test@example.com"
        )

        # Call the endpoint
        from src.handlers.scenarios import analyze_website
        response = await analyze_website(request=request, db=test_db)

        # Verify response
        assert response.run_id is not None
        assert response.status == "success"
        assert response.duration == 120.5
        assert response.steps == 9
        assert response.crawler_summary == {
            "title": "Example Site",
            "pages_found": 3,
            "status": "success"
        }
        assert len(response.tasks) == 2
        assert response.tasks_metadata["total_tasks"] == 2
        assert "user" in response.tasks_metadata["persona_distribution"]
        assert "admin" in response.tasks_metadata["persona_distribution"]
