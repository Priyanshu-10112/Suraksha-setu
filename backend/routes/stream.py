from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from models.camera import get_camera
from services.stream import generate_frames, test_camera_source, get_active_streams

router = APIRouter(prefix="/api/stream", tags=["stream"])

class TestCameraRequest(BaseModel):
    source: str

@router.post("/test")
async def test_camera(request: TestCameraRequest):
    """Test camera source connectivity"""
    success = test_camera_source(request.source)
    
    if success:
        return {
            "status": "success",
            "message": "Camera source is accessible",
            "source": request.source
        }
    else:
        return {
            "status": "failed",
            "message": "Camera source is not accessible",
            "source": request.source
        }

@router.get("/video_feed/{camera_id}")
async def video_feed(camera_id: str):
    """Stream video from camera"""
    camera = get_camera(camera_id)
    
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    return StreamingResponse(
        generate_frames(camera_id, camera["source"]),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/active")
async def active_streams():
    """Get list of active video streams"""
    streams = get_active_streams()
    return {"active_streams": streams}

@router.get("/health/{camera_id}")
async def camera_health(camera_id: str):
    """Check camera health status"""
    from services.stream import camera_streams
    
    camera = get_camera(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    is_streaming = camera_id in camera_streams
    is_opened = False
    can_read = False
    
    if is_streaming:
        cap = camera_streams[camera_id]
        is_opened = cap.isOpened()
        if is_opened:
            ret, _ = cap.read()
            can_read = ret
    
    status = "healthy" if (is_streaming and is_opened and can_read) else "unhealthy"
    
    return {
        "camera_id": camera_id,
        "status": status,
        "is_streaming": is_streaming,
        "is_opened": is_opened,
        "can_read": can_read,
        "source": camera["source"]
    }
