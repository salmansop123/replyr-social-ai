from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.dashboard_analytics import (
    build_platform_summary,
    build_timeseries,
    latest_inbound_feed,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


class PlatformSummary(BaseModel):
    platform: str
    comments_received: int
    dms_received: int = 0
    ai_replies_sent: int
    leads_captured: int
    connected: bool


class LatestInboundItem(BaseModel):
    conversation_id: str
    platform: str
    customer_name: str | None
    message_preview: str
    status: str
    created_at: datetime


class AnalyticsSummaryOut(BaseModel):
    platforms: list[PlatformSummary]
    latest_inbound: list[LatestInboundItem] = []


class TimeseriesPoint(BaseModel):
    date: str
    inbound: int
    outbound: int
    leads: int


class AnalyticsTimeseriesOut(BaseModel):
    points: list[TimeseriesPoint]
    by_platform: dict[str, list[TimeseriesPoint]] = {}


@router.get("/summary", response_model=AnalyticsSummaryOut)
def analytics_summary(
    include_latest: bool = Query(True, description="Include latest inbound messages for dashboard feed"),
    latest_limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsSummaryOut:
    platforms = [PlatformSummary(**row) for row in build_platform_summary(db, current_user.organization_id)]
    latest: list[LatestInboundItem] = []
    if include_latest:
        for row in latest_inbound_feed(db, current_user.organization_id, limit=latest_limit):
            latest.append(LatestInboundItem(**row))
    return AnalyticsSummaryOut(platforms=platforms, latest_inbound=latest)


@router.get("/timeseries", response_model=AnalyticsTimeseriesOut)
def analytics_timeseries(
    days: int = Query(30, ge=1, le=366),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsTimeseriesOut:
    raw = build_timeseries(db, current_user.organization_id, days)
    by_platform = {
        platform: [TimeseriesPoint(**p) for p in series]
        for platform, series in raw.get("by_platform", {}).items()
    }
    return AnalyticsTimeseriesOut(
        points=[TimeseriesPoint(**p) for p in raw["points"]],
        by_platform=by_platform,
    )


@router.get("/latest-inbound", response_model=list[LatestInboundItem])
def analytics_latest_inbound(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[LatestInboundItem]:
    return [LatestInboundItem(**row) for row in latest_inbound_feed(db, current_user.organization_id, limit)]
