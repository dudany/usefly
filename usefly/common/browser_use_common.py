import asyncio
from browser_use import Agent, ChatGoogle, ChatOpenAI, ChatGroq
from usefly.models import SystemConfig, UserJourneyTask


async def run_browser_use_agent(task: str, system_config: SystemConfig, max_steps: int = 30):
    try:
        # llm = ChatOpenAI(model=system_config.model_name, api_key=system_config.api_key)
        llm = ChatGoogle(model=system_config.model_name, api_key=system_config.api_key)
        agent = Agent(
            task=task,
            llm=llm,
            max_steps=max_steps,
            use_vision=True,
            use_thinking=True,
            headless=True
        )

        history = await asyncio.wait_for(agent.run(), timeout=600)
        return history

    except asyncio.TimeoutError:
        raise Exception("Task timeout after 600 seconds")
    except Exception as e:
        raise e


async def run_user_journey_task(journey_task: UserJourneyTask, system_config: SystemConfig, max_steps: int = 30):
    task_description = f"""
You are simulating a {journey_task.persona} persona.

Starting URL: {journey_task.starting_url}
Goal: {journey_task.goal}
Steps to follow: {journey_task.steps}

Navigate to the starting URL and complete the goal by following the steps described. Act like a human shopper: Scroll pages if needed, use site search bars, read descriptions, and abandon or report if site issues persist.

Detailed Guidance:
- Identify elements accurately: For navigation (e.g., to 'חנות'), look for links/buttons with text like 'חנות', 'Shop', or href containing '/shop' or '/חנות'. Use extract or search tools to confirm indices before clicking.
- Verify actions: After any click, check if the URL changes (e.g., to include '/חנות'). If not, retry with a different element, use site search for 'חנות', or navigate directly by modifying URL (e.g., append '/חנות').
- Handle failures: If an action (e.g., refresh or search) fails 3+ times, stop, document the issue (e.g., 'Product not found after multiple attempts'), and suggest alternatives like browsing categories or contacting support.
- Product search: If the exact product isn't found, extract all available products, check for similar items (e.g., other spicy sauces), add a substitute if close, or report unavailability.
- Limit loops: Do not repeat the same action more than 3 times without adaptation.
- Use tools wisely: Employ extract for searches, click for interactions, wait/refresh if UI is slow, and navigate directly to suspected URLs if stuck.

Document your journey, any friction points encountered (e.g., navigation failures, product absence, URL unchanged), and whether you successfully achieved the goal. Log URL after each navigation attempt.
"""

    history = await run_browser_use_agent(task=task_description, system_config=system_config, max_steps=max_steps)

    return {
        "history": history,
        "task_number": journey_task.number,
        "persona": journey_task.persona,
        "starting_url": journey_task.starting_url,
        "goal": journey_task.goal
    }
