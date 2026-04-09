import asyncio
import cv2
import time
from datetime import datetime
from pathlib import Path
from ultralytics import YOLO
from config import CONFIDENCE_THRESHOLD, COOLDOWN_SECONDS, FRAME_SKIP, ALERT_STORAGE_PATH, YOLO_MODEL_PATH
from models.camera import get_camera
from models.zone import get_zones
from models.alert import save_alert
from services.risk import calculate_risk, get_risk_level
from services.websocket import ws_manager
from services.stream import get_camera_stream, release_camera_stream

# Global model instance
model = None
active_detections = {}
last_alert_times = {}

def init_model():
    """Initialize YOLO model once"""
    global model
    if model is None:
        import torch
        _original_load = torch.load
        torch.load = lambda *args, **kwargs: _original_load(*args, **{**kwargs, 'weights_only': False})
        model = YOLO(YOLO_MODEL_PATH)
        Path(ALERT_STORAGE_PATH).mkdir(parents=True, exist_ok=True)

def is_inside_zone(bbox, zone):
    """Check if bounding box center is inside zone"""
    x1, y1, x2, y2 = bbox
    center_x = (x1 + x2) / 2
    center_y = (y1 + y2) / 2
    
    zx1, zy1, zx2, zy2 = zone["x1"], zone["y1"], zone["x2"], zone["y2"]
    return zx1 <= center_x <= zx2 and zy1 <= center_y <= zy2

async def detect_loop(camera_id: str):
    """Main detection loop for a camera"""
    global last_alert_times
    
    camera = get_camera(camera_id)
    if not camera:
        return
    
    zones = get_zones(camera_id)
    source = camera["source"]
    
    # Use shared camera stream
    cap = get_camera_stream(camera_id, source)
    
    if not cap:
        print(f"❌ Failed to open camera: {camera_id}")
        return
    
    frame_count = 0
    
    while camera_id in active_detections:
        ret, frame = cap.read()
        if not ret:
            await asyncio.sleep(0.1)
            continue
        
        frame_count += 1
        if frame_count % FRAME_SKIP != 0:
            continue
        
        # Run detection
        results = model(frame, classes=[0], verbose=False)
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                confidence = float(box.conf[0])
                
                if confidence < CONFIDENCE_THRESHOLD:
                    continue
                
                bbox = box.xyxy[0].cpu().numpy()
                
                # Check if inside any zone
                in_zone = False
                for zone in zones:
                    if is_inside_zone(bbox, zone):
                        in_zone = True
                        break
                
                # Only alert for restricted cameras in zones
                if camera["type"] == "restricted" and in_zone:
                    current_time = time.time()
                    last_time = last_alert_times.get(camera_id, 0)
                    
                    if current_time - last_time < COOLDOWN_SECONDS:
                        continue
                    
                    last_alert_times[camera_id] = current_time
                    
                    # Calculate risk
                    risk = calculate_risk(confidence, in_zone=True)
                    risk_level = get_risk_level(risk)
                    
                    # Save frame
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    image_filename = f"{camera_id}_{timestamp}.jpg"
                    image_path = Path(ALERT_STORAGE_PATH) / image_filename
                    cv2.imwrite(str(image_path), frame)
                    
                    # Create alert
                    alert_data = {
                        "type": "alert",
                        "camera_id": camera_id,
                        "location": camera["location"],
                        "risk": risk,
                        "risk_level": risk_level,
                        "confidence": round(confidence, 2),
                        "image": image_filename,
                        "message": f"Intrusion detected at {camera['location']}",
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    # Save to database
                    save_alert(
                        camera_id,
                        camera["location"],
                        risk,
                        confidence,
                        image_filename,
                        alert_data["message"],
                        alert_data["timestamp"]
                    )
                    
                    # Broadcast via WebSocket
                    await ws_manager.broadcast(alert_data)
                    
                    print(f"🚨 Alert: {camera_id} - {alert_data['message']} (risk: {risk}, confidence: {confidence:.2f})")
        
        await asyncio.sleep(0.01)

def start_detection(camera_id: str):
    """Start detection for camera"""
    if camera_id not in active_detections:
        init_model()
        task = asyncio.create_task(detect_loop(camera_id))
        active_detections[camera_id] = task
        return True
    return False

def stop_detection(camera_id: str):
    """Stop detection for camera"""
    if camera_id in active_detections:
        del active_detections[camera_id]
        # Don't release stream here - it might be used for video feed
        return True
    return False

def get_active_cameras():
    """Get list of active camera IDs"""
    return list(active_detections.keys())
