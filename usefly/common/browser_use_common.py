import asyncio
import os
from pathlib import Path
from browser_use import Agent, ChatGoogle, ChatOpenAI, ChatGroq
from usefly.models import SystemConfig, UserJourneyTask


async def run_browser_use_agent(task: str, system_config: SystemConfig, max_steps: int = 30):
    try:
        llm = ChatOpenAI(model=system_config.model_name, api_key=system_config.api_key)
        # llm = ChatGoogle(model=system_config.model_name, api_key=system_config.api_key) #TODO incorporate open ai and gemini for choosing llm
        agent = Agent(
            task=task,
            llm=llm,
            max_steps=max_steps,
            use_vision=True,
            use_thinking=True,
            headless=True,
            llm_timeout=90
        )

        history = await asyncio.wait_for(agent.run(), timeout=600)
        return history

    except asyncio.TimeoutError:
        raise Exception("Task timeout after 600 seconds")
    except Exception as e:
        raise e
