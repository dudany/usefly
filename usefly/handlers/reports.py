from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict
from datetime import datetime

from usefly.models import PersonaRun, Scenario


def list_report_summaries(db: Session) -> List[Dict]:
    """
    List all unique report_ids with metadata.

    Returns a list of report summaries with scenario information and run counts.
    """
    # Query to get unique report_ids with aggregated metadata
    query = db.query(
        PersonaRun.report_id,
        PersonaRun.config_id,
        func.count(PersonaRun.id).label("run_count"),
        func.min(PersonaRun.timestamp).label("first_run"),
        func.max(PersonaRun.timestamp).label("last_run"),
    ).filter(
        PersonaRun.report_id.isnot(None)
    ).group_by(
        PersonaRun.report_id,
        PersonaRun.config_id
    ).all()

    # Build response with scenario names
    summaries = []
    for row in query:
        scenario = db.query(Scenario).filter(Scenario.id == row.config_id).first()
        scenario_name = scenario.name if scenario else "Unknown Scenario"

        summaries.append({
            "report_id": row.report_id,
            "scenario_id": row.config_id,
            "scenario_name": scenario_name,
            "run_count": row.run_count,
            "first_run": row.first_run.isoformat() if row.first_run else None,
            "last_run": row.last_run.isoformat() if row.last_run else None,
        })

    return summaries


def get_report_aggregate(db: Session, report_id: str) -> Optional[Dict]:
    """
    Get aggregated data for a specific report_id.

    Returns metrics summary and journey Sankey diagram data.
    """
    # Get all runs for this report_id
    runs = db.query(PersonaRun).filter(PersonaRun.report_id == report_id).all()

    if not runs:
        return None

    # Get scenario info from first run
    scenario = db.query(Scenario).filter(Scenario.id == runs[0].config_id).first()
    scenario_name = scenario.name if scenario else "Unknown Scenario"

    # Calculate metrics summary
    metrics_summary = _calculate_metrics_summary(runs)

    # Generate Sankey diagram data
    journey_sankey = _generate_sankey_data(runs)

    return {
        "report_id": report_id,
        "scenario_id": runs[0].config_id,
        "scenario_name": scenario_name,
        "run_count": len(runs),
        "metrics_summary": metrics_summary,
        "journey_sankey": journey_sankey,
    }


def _calculate_metrics_summary(agent_runs: List[PersonaRun]) -> dict:
    """Calculate aggregated metrics from agent runs."""
    if not agent_runs:
        return {}

    completed_count = sum(1 for run in agent_runs if run.is_done)
    failed_count = sum(1 for run in agent_runs if not run.is_done)

    # Calculate average duration (only for completed runs with duration data)
    durations = [run.duration_seconds for run in agent_runs if run.duration_seconds is not None]
    avg_duration = sum(durations) / len(durations) if durations else 0

    # Calculate average steps
    avg_steps = sum(run.steps_completed for run in agent_runs) / len(agent_runs) if agent_runs else 0

    return {
        "total_runs": len(agent_runs),
        "completed_runs": completed_count,
        "failed_runs": failed_count,
        "success_rate": completed_count / len(agent_runs) if agent_runs else 0,
        "avg_duration_seconds": round(avg_duration, 2),
        "avg_steps": round(avg_steps, 1),
    }


def extract_url_sequence_from_events(events: List[dict]) -> List[str]:
    urls = []
    for event in events:
        url = event.get('url')
        if url:
            normalized_url = url.rstrip('/')
            urls.append(normalized_url)
    return urls


def break_sequence_on_cycles(url_sequence: List[str]) -> List[List[str]]:
    if not url_sequence:
        return []

    sequences = []
    current_sequence = []
    seen_in_current = set()

    for url in url_sequence:
        if not current_sequence:
            current_sequence.append(url)
            seen_in_current.add(url)
        elif url == current_sequence[-1]:
            current_sequence.append(url)
        elif url in seen_in_current:
            sequences.append(current_sequence)
            current_sequence = [url]
            seen_in_current = {url}
        else:
            current_sequence.append(url)
            seen_in_current.add(url)

    if current_sequence:
        sequences.append(current_sequence)

    return sequences


def extract_sequences_from_runs(agent_runs: List[PersonaRun]) -> List[List[str]]:
    all_sequences = []
    for run in agent_runs:
        if not run.events:
            continue
        url_sequence = extract_url_sequence_from_events(run.events)
        broken_sequences = break_sequence_on_cycles(url_sequence)
        all_sequences.extend(broken_sequences)
    return all_sequences


def aggregate_transitions(sequences: List[List[str]]) -> Dict[tuple, int]:
    transitions = {}
    for sequence in sequences:
        for i in range(len(sequence) - 1):
            source = sequence[i]
            target = sequence[i + 1]
            if source != target:
                key = (source, target)
                transitions[key] = transitions.get(key, 0) + 1
    return transitions


def calculate_node_metrics(sequences: List[List[str]]) -> Dict[str, Dict[str, int]]:
    metrics = {}

    for sequence in sequences:
        prev_url = None
        for url in sequence:
            if url not in metrics:
                metrics[url] = {"visits": 0, "event_count": 0}

            metrics[url]["event_count"] += 1

            if url != prev_url:
                metrics[url]["visits"] += 1

            prev_url = url

    return metrics


def build_sankey_structure(node_metrics: Dict[str, Dict[str, int]], transitions: Dict[tuple, int]) -> dict:
    urls = sorted(node_metrics.keys())
    url_to_index = {url: idx for idx, url in enumerate(urls)}

    nodes = []
    for url in urls:
        nodes.append({
            "name": url,
            "visits": node_metrics[url]["visits"],
            "event_count": node_metrics[url]["event_count"],
        })

    links = []
    for (source, target), count in transitions.items():
        links.append({
            "source": url_to_index[source],
            "target": url_to_index[target],
            "value": count,
        })

    return {"nodes": nodes, "links": links}


def _generate_sankey_data(agent_runs: List[PersonaRun]) -> dict:
    if not agent_runs:
        return {"nodes": [], "links": []}

    all_sequences = extract_sequences_from_runs(agent_runs)
    transitions = aggregate_transitions(all_sequences)
    node_metrics = calculate_node_metrics(all_sequences)

    return build_sankey_structure(node_metrics, transitions)
