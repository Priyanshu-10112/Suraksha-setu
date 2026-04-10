import asyncio
import cv2
import time
from datetime import datetime
from pathlib import Path
from ultralytics import YOLO
from config import (
    CONFIDENCE_THRESHOLD, COOLDOWN_SECONDS, FRAME_SKIP, 
    ALERT_STORAGE_PATH, YOLO_MODEL_PATH,
    TRACKING_IOU_THRESHOLD, TRACKING_MAX_AGE, TRACKING_MIN_HITS,
    ZONE_IOA_THRESHOLD, ZONE_MARGIN,
    EDGE_MARGIN, MIN_BBOX_WIDTH, MIN_BBOX_HEIGHT,
    MOTION_ENABLED, MOTION_THRESHOLD, MOTION_MIN_AREA,
    RISK_BASE_MULTIPLIER, RISK_ZONE_BONUS, RISK_STABILITY_BONUS, RISK_EDGE_PENALTY
)
from models.camera import get_camera
from models.zone import get_zones
from models.alert import save_alert
from services.risk import get_risk_level
from services.websocket import ws_manager
from services.stream import get_camera_stream, stream_locks, release_camera_stream
from services.tracking import SimpleTracker
from services.filters import apply_filters
from services.zone_utils import (
    calculate_intersection_over_area, 
    is_inside_zone_precise,
    apply_zone_margin
)
from services.motion import MotionDetector

# Global instances
model = None
active_detections = {}
last_alert_times = {}
camera_trackers = {}  # camera_id -> SimpleTracker
camera_motion_detectors = {}  # camera_id -> MotionDetector
alerted_tracks = {}  # camera_id -> set of track_ids that already triggered alert

def init_model():
    """Initialize YOLO model once"""
    global model
    if model is None:
        import torch
        _original_load = torch.load
        torch.load = lambda *args, **kwargs: _original_load(*args, **{**kwargs, 'weights_only': False})
        model = YOLO(YOLO_MODEL_PATH)
        Path(ALERT_STORAGE_PATH).mkdir(parents=True, exist_ok=True)

def calculate_advanced_risk(confidence, ioa, is_stable, near_boundary):
    """
    Calculate risk score with multiple factors
    
    Args:
        confidence: Detection confidence (0-1)
        ioa: Intersection over Area (0-1)
        is_stable: Whether object is tracked across frames
        near_boundary: Whether object is near zone boundary
    
    Returns:
        int: Risk score (0-100)
    """
    # Base risk from confidence
    risk = int(confidence * RISK_BASE_MULTIPLIER)
    
    # Bonus for being fully inside zone
    if ioa > 0.8:
        risk += RISK_ZONE_BONUS
    elif ioa > 0.5:
        risk += RISK_ZONE_BONUS // 2
    
    # Bonus for stable tracking
    if is_stable:
        risk += RISK_STABILITY_BONUS
    
    # Penalty for being near boundary
    if near_boundary:
        risk -= RISK_EDGE_PENALTY
    
    # Cap at 100
    return min(100, max(0, risk))

async def detect_loop(camera_id: str):
    """Enhanced detection loop - processes frames from shared stream"""
    global last_alert_times, camera_trackers, camera_motion_detectors, alerted_tracks
    
    camera = get_camera(camera_id)
    if not camera:
        return
    
    zones = get_zones(camera_id)
    source = camera["source"]
    
    # Apply zone margins
    zones_with_margin = [apply_zone_margin(z, ZONE_MARGIN) for z in zones]
    
    # Initialize tracker and motion detector for this camera
    if camera_id not in camera_trackers:
        camera_trackers[camera_id] = SimpleTracker(
            iou_threshold=TRACKING_IOU_THRESHOLD,
            max_age=TRACKING_MAX_AGE,
            min_hits=TRACKING_MIN_HITS
        )
    
    if camera_id not in camera_motion_detectors and MOTION_ENABLED:
        camera_motion_detectors[camera_id] = MotionDetector(
            threshold=MOTION_THRESHOLD,
            min_area=MOTION_MIN_AREA
        )
    
    if camera_id not in alerted_tracks:
        alerted_tracks[camera_id] = set()
    
    tracker = camera_trackers[camera_id]
    motion_detector = camera_motion_detectors.get(camera_id)
    
    # Get camera stream (shared with video feed)
    cap = get_camera_stream(camera_id, source)
    
    if not cap:
        print(f"❌ Failed to open camera: {camera_id}")
        return
    
    frame_count = 0
    frames_without_motion = 0
    consecutive_failures = 0
    max_failures = 10
    
    print(f"🎯 Enhanced detection started for {camera_id}")
    print(f"📊 Zones configured: {len(zones_with_margin)}")
    print(f"📷 Camera source: {source}")
    
    while camera_id in active_detections:
        try:
            # Use lock to prevent simultaneous access
            lock = stream_locks.get(camera_id)
            if not lock:
                print(f"⚠️ No lock found for {camera_id}")
                await asyncio.sleep(0.1)
                continue
            
            # Try to acquire lock (non-blocking)
            if not lock.acquire(blocking=False):
                await asyncio.sleep(0.05)
                continue
            
            try:
                ret, frame = cap.read()
            finally:
                lock.release()
            
            if not ret:
                consecutive_failures += 1
                if consecutive_failures >= max_failures:
                    print(f"❌ Too many failures for {camera_id}, attempting reconnect...")
                    
                    # Release and reconnect
                    release_camera_stream(camera_id)
                    await asyncio.sleep(1)
                    
                    cap = get_camera_stream(camera_id, source)
                    if not cap:
                        print(f"❌ Reconnection failed for {camera_id}, stopping detection")
                        break
                    
                    print(f"✅ Reconnected camera {camera_id} in detection")
                    consecutive_failures = 0
                    continue
                    
                await asyncio.sleep(0.1)
                continue
            
            consecutive_failures = 0  # Reset on success
            
        except Exception as e:
            print(f"❌ Error reading frame from {camera_id}: {e}")
            await asyncio.sleep(0.5)
            continue
        
        frame_count += 1
        if frame_count % FRAME_SKIP != 0:
            continue
        
        frame_shape = frame.shape
        
        # Motion detection optimization
        if motion_detector:
            has_motion = motion_detector.detect(frame)
            if not has_motion:
                frames_without_motion += 1
                # Skip YOLO if no motion for multiple frames
                if frames_without_motion > 10:
                    await asyncio.sleep(0.01)
                    continue
            else:
                frames_without_motion = 0
        
        # Run YOLO detection
        results = model(frame, classes=[0], verbose=False)
        
        # Collect detections
        detections = []
        detection_count = 0
        for result in results:
            boxes = result.boxes
            detection_count = len(boxes)
            for box in boxes:
                confidence = float(box.conf[0])
                
                # Confidence threshold
                if confidence < CONFIDENCE_THRESHOLD:
                    continue
                
                bbox = box.xyxy[0].cpu().numpy().tolist()
                
                # Apply filters (edge, size)
                filter_result = apply_filters(bbox, frame_shape, {
                    'edge_margin': EDGE_MARGIN,
                    'min_width': MIN_BBOX_WIDTH,
                    'min_height': MIN_BBOX_HEIGHT
                })
                
                if not filter_result:
                    continue
                
                detections.append((bbox, confidence))
        
        # Update tracker
        confirmed_tracks = tracker.update(detections)
        
        # Process confirmed tracks
        for track_id, bbox, confidence, hit_count in confirmed_tracks:
            # Check if this track already triggered an alert
            if track_id in alerted_tracks[camera_id]:
                continue
            
            # Find matching zone with highest priority
            triggered_zone = None
            best_ioa = 0
            zone_priority = {"normal": 0, "safe": 1, "restricted": 2}
            
            for zone in zones_with_margin:
                ioa = calculate_intersection_over_area(bbox, zone)
                
                if ioa >= ZONE_IOA_THRESHOLD:
                    zone_type = zone.get("zone_type", "normal")
                    current_priority = zone_priority[zone_type]
                    
                    if triggered_zone is None:
                        triggered_zone = zone
                        best_ioa = ioa
                    else:
                        prev_priority = zone_priority[triggered_zone.get("zone_type", "normal")]
                        if current_priority > prev_priority or (current_priority == prev_priority and ioa > best_ioa):
                            triggered_zone = zone
                            best_ioa = ioa
            
            # Skip if no zone or normal zone
            if not triggered_zone or triggered_zone.get("zone_type", "normal") == "normal":
                continue
            
            zone_type = triggered_zone.get("zone_type", "normal")
            
            # Determine alert type
            if zone_type == "restricted":
                alert_type = "intrusion"
            elif zone_type == "safe":
                alert_type = "presence"
            else:
                continue
            
            # Check cooldown (time-based)
            current_time = time.time()
            last_time = last_alert_times.get(camera_id, 0)
            
            if current_time - last_time < COOLDOWN_SECONDS:
                continue
            
            last_alert_times[camera_id] = current_time
            
            # Mark this track as alerted
            alerted_tracks[camera_id].add(track_id)
            
            # Calculate advanced risk
            is_stable = hit_count >= TRACKING_MIN_HITS
            near_boundary = best_ioa < 0.5
            risk = calculate_advanced_risk(confidence, best_ioa, is_stable, near_boundary)
            risk_level = get_risk_level(risk)
            
            # Save frame
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            image_filename = f"{camera_id}_{timestamp}.jpg"
            image_path = Path(ALERT_STORAGE_PATH) / image_filename
            
            # Draw bounding box on frame
            x1, y1, x2, y2 = [int(v) for v in bbox]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(frame, f"{alert_type.upper()}", (x1, y1-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            
            cv2.imwrite(str(image_path), frame)
            
            # Create dynamic alert message
            time_str = datetime.now().strftime("%I:%M %p")
            
            if alert_type == "intrusion":
                message = f"⚠️ INTRUSION ALERT - Camera '{camera_id}' at {camera['location']} detected unauthorized person in restricted zone at {time_str}. Risk Level: {risk_level.upper()} ({risk}%), Confidence: {int(confidence*100)}%"
            else:
                message = f"ℹ️ PRESENCE ALERT - Camera '{camera_id}' at {camera['location']} detected person in safe zone at {time_str}. Risk Level: {risk_level.upper()} ({risk}%), Confidence: {int(confidence*100)}%"
            
            # Create alert data
            alert_data = {
                "type": "alert",
                "camera_id": camera_id,
                "location": camera["location"],
                "risk": risk,
                "risk_level": risk_level,
                "confidence": round(confidence, 2),
                "image": image_filename,
                "message": message,
                "timestamp": datetime.now().isoformat(),
                "zone_type": zone_type,
                "alert_type": alert_type,
                "tracking_info": {
                    "track_id": track_id,
                    "hit_count": hit_count,
                    "zone_overlap": round(best_ioa, 2)
                }
            }
            
            # Save to database
            save_alert(
                camera_id,
                camera["location"],
                risk,
                confidence,
                image_filename,
                message,
                alert_data["timestamp"],
                zone_type,
                alert_type
            )
            
            # Broadcast via WebSocket
            await ws_manager.broadcast(alert_data)
            
            print(f"🚨 ALERT: {camera_id} - {alert_type.upper()} in {zone_type} zone")
            print(f"   Risk: {risk} | Confidence: {confidence:.2f} | IoA: {best_ioa:.2f} | Hits: {hit_count}")
        
        await asyncio.sleep(0.01)
    
    # Cleanup
    if camera_id in camera_trackers:
        camera_trackers[camera_id].reset()
    if camera_id in camera_motion_detectors:
        camera_motion_detectors[camera_id].reset()
    if camera_id in alerted_tracks:
        alerted_tracks[camera_id].clear()

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
        # Cleanup trackers
        if camera_id in camera_trackers:
            del camera_trackers[camera_id]
        if camera_id in camera_motion_detectors:
            del camera_motion_detectors[camera_id]
        if camera_id in alerted_tracks:
            del alerted_tracks[camera_id]
        return True
    return False

def get_active_cameras():
    """Get list of active camera IDs"""
    return list(active_detections.keys())
