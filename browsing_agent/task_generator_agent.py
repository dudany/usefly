from pathlib import Path
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain.tools import tool, ToolRuntime
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


class UserJourneyTask(BaseModel):
    number: int = Field(description="Task number")
    starting_url: str = Field(description="Starting URL where user begins")
    goal: str = Field(description="User's goal/intention (e.g., 'Buy spicy onion jam for dinner party')")
    steps: str = Field(description="Step-by-step actions user takes (e.g., 'Navigate to store, add product to cart, go to cart page and stop')")
    persona: str = Field(description="User persona category: SHOPPER, RESEARCHER, LOCAL_VISITOR, SUPPORT_SEEKER, or BROWSER")


class TaskList(BaseModel):
    tasks: list[UserJourneyTask] = Field(description="List of user journey tasks covering SHOPPERS (40%), RESEARCHERS (25%), LOCAL_VISITORS (15%), SUPPORT_SEEKERS (15%), BROWSERS (5%)")
    total_tasks: int = Field(default=0, description="Total number of tasks (should be 15-25)")
    website_url: str = Field(default="", description="Website base URL")





def main():
    llm = ChatOpenAI(model="gpt-5-nano")
    # tools = [get_website_structure]

    with open("prompts/task_generator.txt") as f:
        task_generator = f.read()

    run_id = "20251119_133605_f48a5"
    crawler_path = f"data/crawler_v1/{run_id}/content/final.json"
    with open(crawler_path) as f:
        website_structure_content = f.read()

    agent = create_agent(
        llm,
        # tools=tools,
        response_format=TaskList
    )
    input = task_generator + f"here's the website structure content generate the respones by it: {website_structure_content}" 
    result = agent.invoke({
        "messages": [{
            "role": "user",
            "content": input
        }]
    })

    tasks = result.get("structured_response")

    # Calculate total_tasks if not provided
    if tasks.total_tasks == 0:
        tasks.total_tasks = len(tasks.tasks)

    output_dir = Path(f"data/tasks/{run_id}")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / f"generated_tasks_{run_id}.txt"

    with open(output_file, "w") as f:
        for task in tasks.tasks:
            f.write(f"{task.number}. Enter {task.starting_url}\n")
            f.write(f"   Goal: {task.goal}\n")
            f.write(f"   {task.steps}\n\n")

    print(f"\n{'='*60}")
    print(f"GENERATED {tasks.total_tasks} USER JOURNEY TASKS")
    print(f"{'='*60}\n")

    # Count tasks by persona
    persona_counts = {}
    for task in tasks.tasks:
        persona_counts[task.persona] = persona_counts.get(task.persona, 0) + 1

    for task in tasks.tasks:
        print(f"{task.number}. [{task.persona}] Enter {task.starting_url}")
        print(f"   Goal: {task.goal}")
        print(f"   {task.steps}\n")

    print(f"{'='*60}")
    print(f"PERSONA DISTRIBUTION:")
    for persona, count in sorted(persona_counts.items()):
        percentage = (count / tasks.total_tasks) * 100
        print(f"  {persona}: {count} tasks ({percentage:.1f}%)")
    print(f"{'='*60}")
    print(f"\n✓ Tasks saved to: {output_file}")


if __name__ == "__main__":
    main()
