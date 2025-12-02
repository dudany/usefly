from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict
import uuid

from usefly.models import Report, Scenario, AgentRun, ReportCreate

def list_reports(
    db: Session,
    config_id: Optional[str] = None,
    is_baseline: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Report]:
    """List reports with optional filters."""
    query = db.query(Report).order_by(Report.created_at.desc())

    if config_id:
        query = query.filter(Report.config_id == config_id)
    if is_baseline is not None:
        query = query.filter(Report.is_baseline == is_baseline)

    return query.offset(offset).limit(limit).all()

def create_report(db: Session, report: ReportCreate) -> Report:
    """Create a new report."""
    # Verify scenario exists
    scenario = db.query(Scenario).filter(Scenario.id == report.config_id).first()
    if not scenario:
        raise ValueError("Scenario not found")

    # Calculate metrics summary from runs with this config
    config_runs = db.query(AgentRun).filter(AgentRun.config_id == report.config_id).all()

    # Calculate metrics summary
    metrics_summary = _calculate_metrics_summary(config_runs)

    # Generate sankey data
    journey_sankey = _generate_sankey_data(config_runs)

    db_report = Report(
        id=str(uuid.uuid4()),
        config_id=report.config_id,
        name=report.name,
        description=report.description,
        is_baseline=report.is_baseline,
        metrics_summary=metrics_summary,
        journey_sankey=journey_sankey,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_report(db: Session, report_id: str) -> Optional[Report]:
    """Get a specific report."""
    return db.query(Report).filter(Report.id == report_id).first()

def _calculate_metrics_summary(agent_runs: List[AgentRun]) -> dict:
    """Calculate aggregated metrics from agent runs."""
    if not agent_runs:
        return {}

    success_count = sum(1 for run in agent_runs if run.status == "success")
    error_count = sum(1 for run in agent_runs if run.status == "error")
    anomaly_count = sum(1 for run in agent_runs if run.status == "anomaly")

    avg_duration = sum(run.duration or 0 for run in agent_runs) / len(agent_runs) if agent_runs else 0
    avg_completion = sum(run.steps_completed for run in agent_runs) / len(agent_runs) if agent_runs else 0

    return {
        "total_runs": len(agent_runs),
        "success_count": success_count,
        "error_count": error_count,
        "anomaly_count": anomaly_count,
        "success_rate": success_count / len(agent_runs) if agent_runs else 0,
        "avg_duration": avg_duration,
        "avg_completion": avg_completion,
    }

def _generate_sankey_data(agent_runs: List[AgentRun]) -> dict:
    """Generate Sankey diagram data from journey paths."""
    if not agent_runs:
        return {"nodes": [], "links": []}

    # Collect all unique pages
    pages = set()
    for run in agent_runs:
        pages.update(run.journey_path)

    pages_list = sorted(list(pages))
    page_to_index = {page: idx for idx, page in enumerate(pages_list)}

    # Count transitions
    transitions = {}
    for run in agent_runs:
        path = run.journey_path
        for i in range(len(path) - 1):
            source = path[i]
            target = path[i + 1]
            key = (source, target)
            transitions[key] = transitions.get(key, 0) + 1

    # Build nodes with stats
    nodes = []
    page_stats = {page: {"visits": 0, "errors": 0} for page in pages_list}

    for run in agent_runs:
        for page in run.journey_path:
            page_stats[page]["visits"] += 1
        # Add errors from friction points
        for friction in run.friction_points:
            if friction.get("step") in page_stats:
                page_stats[friction["step"]]["errors"] += 1

    for page in pages_list:
        nodes.append({
            "name": page,
            "visits": page_stats[page]["visits"],
            "errors": page_stats[page]["errors"],
        })

    # Build links
    links = []
    for (source, target), count in transitions.items():
        links.append({
            "source": page_to_index[source],
            "target": page_to_index[target],
            "value": count,
        })

    return {"nodes": nodes, "links": links}
