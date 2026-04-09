from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.camera import add_camera, get_all_cameras, get_camera, delete_camera

router = APIRouter(prefix="/api/cameras", tags=["cameras"])

class CameraCreate(BaseModel):
    camera_id: str
    source: str
    location: str
    type: str

@router.post("/")
async def create_camera(camera: CameraCreate):
    """Add new camera"""
    try:
        result = add_camera(camera.camera_id, camera.source, camera.location, camera.type)
        return {"status": "success", "camera": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
async def list_cameras():
    """Get all cameras"""
    cameras = get_all_cameras()
    return {"cameras": cameras}

@router.get("/{camera_id}")
async def get_camera_detail(camera_id: str):
    """Get camera by ID"""
    camera = get_camera(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"camera": camera}

@router.delete("/{camera_id}")
async def remove_camera(camera_id: str):
    """Delete camera"""
    delete_camera(camera_id)
    return {"status": "success", "message": "Camera deleted"}
