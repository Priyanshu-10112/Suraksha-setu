from fastapi import APIRouter, HTTPException
from services.detection import start_detection, stop_detection, get_active_cameras

router = APIRouter(prefix="/api/control", tags=["control"])

@router.post("/start/{camera_id}")
async def start_camera(camera_id: str):
    """Start detection for camera"""
    success = start_detection(camera_id)
    if success:
        return {"status": "success", "message": f"Detection started for {camera_id}"}
    return {"status": "info", "message": f"Detection already running for {camera_id}"}

@router.post("/stop/{camera_id}")
async def stop_camera(camera_id: str):
    """Stop detection for camera"""
    success = stop_detection(camera_id)
    if success:
        return {"status": "success", "message": f"Detection stopped for {camera_id}"}
    return {"status": "info", "message": f"Detection not running for {camera_id}"}

@router.get("/active")
async def active_cameras():
    """Get active cameras"""
    cameras = get_active_cameras()
    return {"active_cameras": cameras}
