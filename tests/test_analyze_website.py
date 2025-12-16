"""Tests for website analysis endpoint."""

import pytest
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime
from src.models import CrawlerAnalysisRequest


@pytest.mark.asyncio
async def test_analyze_website_success(mock_system_config, mock_agent_history, test_db):
    """Test successful website analysis."""

    with patch('src.handlers.scenarios.run_browser_use_agent') as mock_run_agent, \
         patch('src.handlers.scenarios.generate_tasks') as mock_task_gen, \
         patch('builtins.open', MagicMock()):

        # Setup mocks
        mock_run_agent.return_value = mock_agent_history

        # Mock task generation
        mock_task = Mock()
        mock_task.persona = "user"
        mock_task.dict = lambda: {"persona": "user", "name": "Task 1", "number": 1}

        mock_task2 = Mock()
        mock_task2.persona = "admin"
        mock_task2.dict = lambda: {"persona": "admin", "name": "Task 2", "number": 2}

        mock_task_list = MagicMock()
        mock_task_list.total_tasks = 2
        mock_task_list.tasks = [mock_task, mock_task2]
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
        response = await analyze_website(db=test_db, request=request)

        # Verify response structure
        assert response["run_id"] is not None
        assert response["status"] == "success"
        assert response["duration"] == 120.5
        assert response["steps"] == 9
        assert response["crawler_summary"] == {
            "title": "Example Site",
            "pages_found": 3,
            "status": "success"
        }
        assert len(response["tasks"]) == 2
        assert response["tasks_metadata"]["total_tasks"] == 2
        assert "user" in response["tasks_metadata"]["persona_distribution"]
        assert "admin" in response["tasks_metadata"]["persona_distribution"]
