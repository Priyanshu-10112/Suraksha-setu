from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.zone import add_zone, get_zones, delete_zone

router = APIRouter(prefix="/api/zones", tags=["zones"])

class ZoneCreate(BaseModel):
    camera_id: str
    x1: int
    y1: int
    x2: int
    y2: int
    zone_type: str = "normal"  # "normal", "safe", "restricted"

@router.post("/")
async def create_zone(zone: ZoneCreate):
    """Add zone for camera"""
    # Validate zone_type
    valid_types = ["normal", "safe", "restricted"]
    if zone.zone_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid zone_type. Must be one of: {valid_types}")
    
    result = add_zone(zone.camera_id, zone.x1, zone.y1, zone.x2, zone.y2, zone.zone_type)
    return {"status": "success", "zone": result}

@router.get("/{camera_id}")
async def list_zones(camera_id: str):
    """Get zones for camera"""
    zones = get_zones(camera_id)
    return {"zones": zones}

@router.delete("/{zone_id}")
async def remove_zone(zone_id: int):
    """Delete zone"""
    delete_zone(zone_id)
    return {"status": "success", "message": "Zone deleted"}
