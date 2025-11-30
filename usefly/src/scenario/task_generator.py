"""
Task generation module for creating user journey tasks from crawler results.

Takes the website structure from crawler and generates realistic user journey tasks
using LLM with structured output.
"""

from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

import json
class UserJourneyTask(BaseModel):
    """Represents a single user journey task."""
    number: int = Field(description="Task number")
    starting_url: str = Field(description="Starting URL where user begins")
    goal: str = Field(description="User's goal/intention (e.g., 'Buy spicy onion jam for dinner party')")
    steps: str = Field(description="Step-by-step actions user takes")
    persona: str = Field(description="User persona category: SHOPPER, RESEARCHER, LOCAL_VISITOR, SUPPORT_SEEKER, or BROWSER")


class TaskList(BaseModel):
    """List of generated user journey tasks."""
    tasks: List[UserJourneyTask] = Field(description="List of user journey tasks")
    total_tasks: int = Field(default=0, description="Total number of tasks")
    website_url: str = Field(default="", description="Website base URL")


def generate_tasks_from_crawler_result(
    crawler_final_result: Dict,
    website_url: str,
    model_name: str,
    api_key: Optional[str] = None
) -> TaskList:
    with open("usefly/prompts/task_generator_prompt.txt") as f:
        task_generator_prompt = f.read()

    # Initialize LLM
    llm = ChatOpenAI(model=model_name, api_key=api_key)

    # Create agent with structured output
    agent = llm.with_structured_output(TaskList)

    # Format input - convert crawler result to string for LLM
    
    crawler_content = json.dumps(crawler_final_result, indent=2) if isinstance(crawler_final_result, dict) else str(crawler_final_result)

    input_text = (
        f"{task_generator_prompt}\n\n"
        f"Here's the website structure content, generate the response from it:\n"
        f"{crawler_content}"
    )

    # Generate tasks
    tasks = agent.invoke(input_text)

    # Calculate total_tasks if not provided
    if tasks.total_tasks == 0:
        tasks.total_tasks = len(tasks.tasks)

    tasks.website_url = website_url

    return tasks
