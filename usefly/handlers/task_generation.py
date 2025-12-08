"""Task generation utilities for scenarios."""

from typing import Dict, List, Optional, Tuple
import json
from datetime import datetime
from langchain_openai import ChatOpenAI as LangchainChatOpenAI

from usefly.models import TaskList


def load_prompt_template(prompt_type: str, num_tasks: int, custom_prompt: Optional[str] = None) -> str:
    """
    Load and prepare the task generation prompt template.

    Args:
        prompt_type: Type of prompt ('friction' or 'standard')
        num_tasks: Number of tasks to generate
        custom_prompt: Optional custom prompt instructions

    Returns:
        Prepared prompt string with placeholders replaced
    """
    prompt_file = (
        "usefly/prompts/friction_task_generator_prompt.txt"
        if prompt_type == "friction"
        else "usefly/prompts/task_generator_prompt.txt"
    )

    with open(prompt_file) as f:
        task_prompt = f.read()

    # Replace placeholders
    task_prompt = task_prompt.replace("{num_tasks}", str(num_tasks))
    if "{custom_prompt}" in task_prompt:
        task_prompt = task_prompt.replace("{custom_prompt}", custom_prompt or "")

    return task_prompt


def prepare_generation_context(
    existing_tasks: List[Dict],
    crawler_result: any,
    max_context_tasks: int = 10
) -> Tuple[str, str]:
    """
    Prepare context for task generation from existing data.

    Args:
        existing_tasks: List of existing task dictionaries
        crawler_result: Crawler final result (dict or string)
        max_context_tasks: Maximum number of existing tasks to include in context

    Returns:
        Tuple of (existing_tasks_summary, crawler_result_string)
    """
    # Parse crawler result if string
    if isinstance(crawler_result, str):
        try:
            crawler_result = json.loads(crawler_result)
        except json.JSONDecodeError:
            pass  # Keep as string if JSON parsing fails

    # Convert crawler result to string
    crawler_str = (
        json.dumps(crawler_result, indent=2)
        if isinstance(crawler_result, dict)
        else str(crawler_result)
    )

    # Build existing tasks summary
    tasks_for_context = existing_tasks[:max_context_tasks]
    existing_summary = "\n".join([
        f"Task {t.get('number')}: {t.get('goal')}"
        for t in tasks_for_context
    ])

    return existing_summary, crawler_str


def generate_tasks_with_llm(
    prompt_template: str,
    existing_tasks_summary: str,
    crawler_context: str,
    model_name: str,
    api_key: Optional[str] = None
) -> TaskList:
    """
    Generate tasks using LLM with structured output.

    Args:
        prompt_template: Prepared prompt template
        existing_tasks_summary: Summary of existing tasks to avoid duplication
        crawler_context: Website structure from crawler
        model_name: LLM model name
        api_key: Optional API key for the LLM

    Returns:
        TaskList with newly generated tasks

    Raises:
        ValueError: If task generation fails
    """
    # Initialize LLM with structured output
    llm = LangchainChatOpenAI(model=model_name, api_key=api_key)
    agent = llm.with_structured_output(TaskList)

    # Construct full input
    input_text = (
        f"{prompt_template}\n\n"
        f"### Existing Tasks (avoid duplication):\n{existing_tasks_summary}\n\n"
        f"### Website Structure:\n{crawler_context}"
    )

    try:
        task_list = agent.invoke(input_text)
        return task_list
    except Exception as e:
        raise ValueError(f"Task generation failed: {str(e)}")


def renumber_tasks(new_tasks: List, existing_tasks: List[Dict]) -> List[Dict]:
    """
    Renumber new tasks to continue from the highest existing task number.

    Args:
        new_tasks: List of newly generated tasks (from TaskList.tasks)
        existing_tasks: List of existing task dictionaries

    Returns:
        List of renumbered task dictionaries
    """
    max_num = max([t.get("number", 0) for t in existing_tasks]) if existing_tasks else 0

    renumbered = []
    for i, task in enumerate(new_tasks):
        task_dict = task.dict()
        task_dict["number"] = max_num + i + 1
        renumbered.append(task_dict)

    return renumbered


def calculate_persona_distribution(tasks: List[Dict]) -> Dict[str, int]:
    """
    Calculate the distribution of personas across tasks.

    Args:
        tasks: List of task dictionaries

    Returns:
        Dictionary mapping persona names to their counts
    """
    persona_counts = {}
    for task in tasks:
        persona = task.get("persona", "Unknown")
        persona_counts[persona] = persona_counts.get(persona, 0) + 1

    return persona_counts


def update_generation_metadata(
    current_metadata: Dict,
    new_tasks: List[Dict],
    all_tasks: List[Dict],
    prompt_type: str,
    custom_prompt_used: bool
) -> Dict:
    """
    Update scenario metadata with new task generation information.

    Args:
        current_metadata: Current scenario metadata
        new_tasks: List of newly generated task dictionaries
        all_tasks: Complete list of all tasks (existing + new)
        prompt_type: Type of prompt used for generation
        custom_prompt_used: Whether a custom prompt was provided

    Returns:
        Updated metadata dictionary
    """
    # Update generation history
    generation_history = current_metadata.get("generation_history", [])
    generation_history.append({
        "timestamp": datetime.now().isoformat(),
        "prompt_type": prompt_type,
        "num_generated": len(new_tasks),
        "custom_prompt_used": custom_prompt_used
    })

    # Calculate persona distribution
    persona_distribution = calculate_persona_distribution(all_tasks)

    # Build updated metadata
    updated_metadata = {
        **current_metadata,
        "total_tasks": len(all_tasks),
        "persona_distribution": persona_distribution,
        "generation_history": generation_history,
        "last_generated": datetime.now().isoformat()
    }

    return updated_metadata


def calculate_auto_selected_tasks(
    all_tasks: List[Dict],
    current_selected_numbers: List[int],
    new_task_numbers: List[int]
) -> Tuple[List[int], List[int]]:
    """
    Calculate updated task selection including auto-selected new tasks.

    Args:
        all_tasks: Complete list of all tasks
        current_selected_numbers: Currently selected task numbers
        new_task_numbers: Numbers of newly generated tasks to auto-select

    Returns:
        Tuple of (selected_indices, all_selected_numbers)
    """
    # Combine current and new selections (unique)
    all_selected = list(set(current_selected_numbers + new_task_numbers))

    # Calculate indices
    selected_indices = [
        i for i, task in enumerate(all_tasks)
        if task.get("number") in all_selected
    ]

    return selected_indices, all_selected
