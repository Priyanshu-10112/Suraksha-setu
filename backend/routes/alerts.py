from fastapi import APIRouter
from models.alert import get_alerts

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("/")
async def list_alerts(limit: int = 10):
    """Get recent alerts"""
    alerts = get_alerts(limit)
    return {"alerts": alerts}
