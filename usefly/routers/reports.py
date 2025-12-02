from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from usefly.database import get_db
from usefly.models import ReportResponse, ReportCreate
from usefly.handlers import reports as reports_handler

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("", response_model=List[ReportResponse])
def list_reports(
    config_id: str = None,
    is_baseline: bool = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List reports with optional filters."""
    return reports_handler.list_reports(db, config_id, is_baseline, limit, offset)

@router.post("", response_model=ReportResponse)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    """Create a new report."""
    try:
        return reports_handler.create_report(db, report)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    """Get a specific report."""
    report = reports_handler.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
