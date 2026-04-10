from fastapi import APIRouter, HTTPException
from models.alert import get_alerts, delete_alert, get_alert_by_id

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("/")
async def list_alerts(limit: int = 10):
    """Get recent alerts"""
    alerts = get_alerts(limit)
    return {"alerts": alerts, "count": len(alerts)}

@router.get("/{alert_id}")
async def get_alert(alert_id: int):
    """Get single alert by ID"""
    alert = get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.delete("/{alert_id}")
async def delete_alert_endpoint(alert_id: int):
    """Delete alert and its image file"""
    result = delete_alert(alert_id)
    
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result