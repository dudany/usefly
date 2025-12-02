import asyncio
import json
import base64
from pathlib import Path
from uuid import uuid4
from datetime import datetime
from typing import Optional
from browser_use import Agent, ChatOpenAI
from dotenv import load_dotenv

load_dotenv()


def save_session(history, prompt_v = None,base_path=Path("data")):
    session_id = str(uuid4())
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    short_uuid = session_id[:5]
    session_path = base_path / prompt_v /f"{timestamp}_{short_uuid}" if prompt_v else base_path /f"{timestamp}_{short_uuid}"

    (session_path / "screenshots").mkdir(parents=True, exist_ok=True)
    (session_path / "urls").mkdir(parents=True, exist_ok=True)
    (session_path / "actions").mkdir(parents=True, exist_ok=True)
    (session_path / "errors").mkdir(parents=True, exist_ok=True)
    (session_path / "content").mkdir(parents=True, exist_ok=True)
    (session_path / "models").mkdir(parents=True, exist_ok=True)
    (session_path / "metadata").mkdir(parents=True, exist_ok=True)

    json.dump(history.urls(), open(session_path / "urls" / "urls.json", "w"), indent=2)

    for idx, screenshot in enumerate(history.screenshots()):
        if screenshot:
            (session_path / "screenshots" / f"screenshot_{idx:03d}.png").write_bytes(base64.b64decode(screenshot))

    json.dump(history.screenshot_paths(), open(session_path / "screenshots" / "paths.json", "w"), indent=2)
    json.dump(history.action_names(), open(session_path / "actions" / "names.json", "w"), indent=2)
    json.dump([a.model_dump() if hasattr(a, 'model_dump') else str(a) for a in history.model_actions()], open(session_path / "models" / "actions.json", "w"), indent=2, default=str)
    json.dump([o.model_dump() if hasattr(o, 'model_dump') else str(o) for o in history.model_outputs()], open(session_path / "models" / "outputs.json", "w"), indent=2, default=str)
    json.dump([t.model_dump() if hasattr(t, 'model_dump') else str(t) for t in history.model_thoughts()], open(session_path / "models" / "thoughts.json", "w"), indent=2, default=str)
    json.dump(history.extracted_content(), open(session_path / "content" / "extracted.json", "w"), indent=2, default=str)
    json.dump(history.final_result(), open(session_path / "content" / "final.json", "w"), indent=2, default=str)
    json.dump([str(e) if e else None for e in history.errors()], open(session_path / "errors" / "errors.json", "w"), indent=2)
    json.dump([r.model_dump() if hasattr(r, 'model_dump') else str(r) for r in history.action_results()], open(session_path / "actions" / "results.json", "w"), indent=2, default=str)
    json.dump(history.action_history(), open(session_path / "actions" / "history.json", "w"), indent=2, default=str)

    json.dump({
        "session_id": session_id,
        "is_done": history.is_done(),
        "is_successful": history.is_successful(),
        "has_errors": history.has_errors(),
        "steps": history.number_of_steps(),
        "duration": history.total_duration_seconds()
    }, open(session_path / "metadata" / "meta.json", "w"), indent=2)

    return session_path


async def main(
    task: str,
    model_name: str = 'gpt-4o',
    api_key: Optional[str] = None,
    use_thinking: bool = True,
    prompt_v: str = 'website_crawler'
):
    """
    Run crawler with configurable parameters.

    Args:
        task: The formatted prompt/task for the crawler
        model_name: OpenAI model to use (default: gpt-4o)
        api_key: OpenAI API key (if provided, sets OPENAI_API_KEY env var)
        use_thinking: Whether to enable thinking mode
        prompt_v: Prompt version identifier for file organization

    Returns:
        History object from the crawler run
    """
    import os
    if api_key:
        os.environ['OPENAI_API_KEY'] = api_key

    llm = ChatOpenAI(model=model_name)
    agent = Agent(
        task=task,
        llm=llm,
        max_steps=30,
        use_vision=True,
        use_thinking=use_thinking,
        headless=True,
    )

    history = await agent.run()
    return history  # Return history instead of saving here


if __name__ == '__main__':
    website = 'https://www.hadinarim.co.il'
    # https://www.fanoutdoor.com/ another website
    tasks = [

        """
        1. Enter this Hot Sauces website in hebrew https://www.hadinarim.co.il/
        2. enter the store 
        3. add to cart `spicy onion jam` or `ריבת בצל חריפה`
        4. go to the cart-page and stop
        transalate the product names to hebrew, the whole site is in hebrew
        """
    ]
    prompt_v = 'crawler_v1'
    with open(f'prompts/{prompt_v}.txt', 'r') as f:
        prompt = f.read().format(website=website)
    asyncio.run(main(prompt,prompt_v))