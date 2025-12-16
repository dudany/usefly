import asyncio
import os
from pathlib import Path
from browser_use import Agent, ChatGoogle, ChatOpenAI, ChatGroq
from langchain_anthropic import ChatAnthropic
from src.models import SystemConfig, UserJourneyTask


async def run_browser_use_agent(task: str, system_config: SystemConfig, max_steps: int | None = None):
    try:
        # Use config max_steps if not explicitly provided
        steps = max_steps or system_config.max_steps

        # Initialize LLM based on provider
        provider = system_config.provider.lower()

        if provider == "openai":
            llm = ChatOpenAI(model=system_config.model_name, api_key=system_config.api_key)
        elif provider == "claude":
            llm = ChatAnthropic(model=system_config.model_name, api_key=system_config.api_key)
        elif provider == "groq":
            llm = ChatGroq(model=system_config.model_name, api_key=system_config.api_key)
        elif provider == "google":
            llm = ChatGoogle(model=system_config.model_name, api_key=system_config.api_key)
        else:
            # Default to OpenAI if provider unknown
            llm = ChatOpenAI(model=system_config.model_name, api_key=system_config.api_key)

        agent = Agent(
            task=task,
            llm=llm,
            max_steps=steps,
            use_vision=True,
            use_thinking=True,
            headless=True,
            llm_timeout=90
        )

        return await agent.run()

    except Exception as e:
        raise e
