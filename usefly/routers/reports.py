from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from usefly.database import get_db
from usefly.handlers import reports

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/list")
async def list_reports(db: Session = Depends(get_db)):
    """List all unique report_ids with metadata."""
    return reports.list_report_summaries(db)


@router.get("/{report_id}/aggregate")
async def get_report_aggregate(report_id: str, db: Session = Depends(get_db)):
    """Get aggregated data for a specific report_id."""
    result = reports.get_report_aggregate(db, report_id)
    if not result:
        raise HTTPException(status_code=404, detail="Report not found")
    return result
