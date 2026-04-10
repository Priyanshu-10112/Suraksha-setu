import cv2
import asyncio
from typing import Dict, Optional
from threading import Lock
from ultralytics import YOLO
from pathlib import Path

# Import detection utilities
import sys
sys.path.append(str(Path(__file__).parent.parent))
from config import (
    CONFIDENCE_THRESHOLD, YOLO_MODEL_PATH,
    ZONE_IOA_THRESHOLD, ZONE_MARGIN
)

# Global camera streams dictionary
camera_streams: Dict[str, cv2.VideoCapture] = {}
stream_locks: Dict[str, Lock] = {}

# YOLO model for live detection
live_model = None

def init_live_model():
    """Initialize YOLO model for live stream detection"""
    global live_model
    if live_model is None:
        import torch
        _original_load = torch.load
        torch.load = lambda *args, **kwargs: _original_load(*args, **{**kwargs, 'weights_only': False})
        live_model = YOLO(YOLO_MODEL_PATH)
        print("✅ Live detection model loaded for video streams")

def get_camera_stream(camera_id: str, source: str) -> Optional[cv2.VideoCapture]:
    """Get or create camera stream with retry logic"""
    if camera_id in camera_streams:
        # Check if existing stream is still valid
        cap = camera_streams[camera_id]
        if cap.isOpened():
            return cap
        else:
            # Stream died, clean it up
            print(f"⚠️ Existing stream for {camera_id} is dead, recreating...")
            release_camera_stream(camera_id)
    
    # Convert source to int if it's a number
    try:
        source = int(source)
    except:
        pass
    
    # Try to open camera with retries
    max_retries = 3
    for attempt in range(max_retries):
        cap = cv2.VideoCapture(source)
        
        # Set camera properties for better stability
        if cap.isOpened():
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduce buffer to get latest frame
            cap.set(cv2.CAP_PROP_FPS, 30)
            
            # Test if we can actually read a frame
            ret, frame = cap.read()
            if ret and frame is not None:
                camera_streams[camera_id] = cap
                stream_locks[camera_id] = Lock()
                print(f"✅ Camera stream opened for {camera_id} (attempt {attempt + 1})")
                return cap
            else:
                cap.release()
                print(f"⚠️ Camera opened but can't read frame for {camera_id} (attempt {attempt + 1})")
        else:
            print(f"⚠️ Failed to open camera {camera_id} (attempt {attempt + 1})")
        
        if attempt < max_retries - 1:
            import time
            time.sleep(0.5)  # Wait before retry
    
    print(f"❌ Failed to open camera {camera_id} after {max_retries} attempts")
    return None

def release_camera_stream(camera_id: str):
    """Release camera stream"""
    if camera_id in camera_streams:
        camera_streams[camera_id].release()
        del camera_streams[camera_id]
        if camera_id in stream_locks:
            del stream_locks[camera_id]

def test_camera_source(source: str) -> bool:
    """Test if camera source is accessible"""
    try:
        # Convert to int if numeric
        try:
            source = int(source)
        except:
            pass
        
        cap = cv2.VideoCapture(source)
        if cap.isOpened():
            ret, frame = cap.read()
            cap.release()
            return ret and frame is not None
        return False
    except:
        return False

def generate_frames(camera_id: str, source: str):
    """Generate MJPEG frames with real-time person detection and color-coded boxes"""
    from models.zone import get_zones
    from services.zone_utils import calculate_intersection_over_area, apply_zone_margin
    from services.face_recognition_service import (
        get_face_encoding, 
        match_face, 
        is_dataset_loaded
    )
    
    cap = get_camera_stream(camera_id, source)
    
    if not cap:
        print(f"❌ Failed to get camera stream for {camera_id}")
        return
    
    # Initialize live detection model
    init_live_model()
    
    print(f"✅ Starting enhanced stream for {camera_id}")
    if is_dataset_loaded():
        print(f"✅ Face recognition enabled for stream {camera_id}")
    
    consecutive_failures = 0
    max_failures = 5
    frame_count = 0
    criminal_tracks = {}  # Track criminal detections to avoid repeated checks
    
    try:
        while True:
            lock = stream_locks.get(camera_id)
            if not lock:
                print(f"⚠️ No lock found for {camera_id}")
                break
            
            try:
                with lock:
                    success, frame = cap.read()
                
                if not success:
                    consecutive_failures += 1
                    
                    if consecutive_failures >= max_failures:
                        print(f"❌ Max failures reached for {camera_id}, attempting reconnect...")
                        
                        # Release old stream
                        release_camera_stream(camera_id)
                        
                        # Try to reconnect
                        import time
                        time.sleep(1)
                        cap = get_camera_stream(camera_id, source)
                        
                        if not cap:
                            print(f"❌ Reconnection failed for {camera_id}, stopping stream")
                            break
                        
                        print(f"✅ Reconnected camera {camera_id}")
                        consecutive_failures = 0
                        continue
                    
                    import time
                    time.sleep(0.2)
                    continue
                
                # Reset failure counter on success
                consecutive_failures = 0
                frame_count += 1
                
                # Run detection every 2 frames for performance
                if frame_count % 2 == 0 and live_model:
                    # Reload zones every frame to get latest configuration
                    zones = get_zones(camera_id)
                    zones_with_margin = [apply_zone_margin(z, ZONE_MARGIN) for z in zones]
                    
                    # Run YOLO detection
                    results = live_model(frame, classes=[0], verbose=False)
                    
                    # Draw detections with color coding
                    for result in results:
                        boxes = result.boxes
                        for box in boxes:
                            confidence = float(box.conf[0])
                            
                            # Only show confident detections
                            if confidence < CONFIDENCE_THRESHOLD:
                                continue
                            
                            bbox = box.xyxy[0].cpu().numpy().tolist()
                            x1, y1, x2, y2 = [int(v) for v in bbox]
                            
                            # === FACE RECOGNITION CHECK (CRIMINAL DETECTION) ===
                            is_criminal = False
                            suspect_name = None
                            face_conf = None
                            
                            # Run face recognition every 5th frame for high-confidence detections
                            if (is_dataset_loaded() and 
                                frame_count % 5 == 0 and 
                                confidence > 0.70):
                                try:
                                    face_encoding = get_face_encoding(frame, bbox)
                                    if face_encoding is not None:
                                        match_result = match_face(face_encoding)
                                        if match_result and match_result['confidence'] >= 0.80:
                                            suspect_name = match_result['name']
                                            face_conf = match_result['confidence']
                                            is_criminal = True
                                            # Cache criminal detection
                                            bbox_key = f"{x1}_{y1}_{x2}_{y2}"
                                            criminal_tracks[bbox_key] = (suspect_name, face_conf)
                                except Exception as e:
                                    pass  # Silently fail to avoid breaking stream
                            
                            # Check if this bbox was previously identified as criminal
                            bbox_key = f"{x1}_{y1}_{x2}_{y2}"
                            if bbox_key in criminal_tracks:
                                suspect_name, face_conf = criminal_tracks[bbox_key]
                                is_criminal = True
                            
                            # === DRAW CRIMINAL WITH RED BORDER ===
                            if is_criminal:
                                color = (0, 0, 255)  # Bright red for criminals
                                label = f"CRIMINAL: {suspect_name} {int(face_conf*100)}%"
                                
                                # Draw thick red bounding box
                                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 4)
                                
                                # Draw label background (red)
                                label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                                cv2.rectangle(frame, (x1, y1 - label_size[1] - 15), 
                                            (x1 + label_size[0] + 10, y1), color, -1)
                                
                                # Draw label text (white)
                                cv2.putText(frame, label, (x1 + 5, y1 - 8), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                                
                                # Add warning icon/text
                                cv2.putText(frame, "!!! ALERT !!!", (x1, y2 + 25), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                                
                                continue  # Skip zone-based detection for criminals
                            
                            # === NORMAL ZONE-BASED DETECTION ===
                            # Determine zone type and color
                            zone_type = "normal"
                            best_ioa = 0
                            
                            for zone in zones_with_margin:
                                ioa = calculate_intersection_over_area(bbox, zone)
                                if ioa >= ZONE_IOA_THRESHOLD and ioa > best_ioa:
                                    zone_type = zone.get("zone_type", "normal")
                                    best_ioa = ioa
                            
                            # Color coding based on zone type
                            if zone_type == "restricted":
                                color = (0, 0, 255)  # Red for restricted
                                label = f"INTRUSION {int(confidence*100)}%"
                            elif zone_type == "safe":
                                color = (0, 255, 255)  # Yellow for safe
                                label = f"PRESENCE {int(confidence*100)}%"
                            else:
                                color = (0, 255, 0)  # Green for normal
                                label = f"PERSON {int(confidence*100)}%"
                            
                            # Draw bounding box
                            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                            
                            # Draw label background
                            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
                            cv2.rectangle(frame, (x1, y1 - label_size[1] - 10), 
                                        (x1 + label_size[0], y1), color, -1)
                            
                            # Draw label text
                            cv2.putText(frame, label, (x1, y1 - 5), 
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
                    
                    # Draw zones on frame (semi-transparent)
                    overlay = frame.copy()
                    for zone in zones:
                        z_x1, z_y1 = int(zone['x1']), int(zone['y1'])
                        z_x2, z_y2 = int(zone['x2']), int(zone['y2'])
                        z_type = zone.get('zone_type', 'normal')
                        
                        # Zone border color
                        if z_type == "restricted":
                            z_color = (0, 0, 255)  # Red
                        elif z_type == "safe":
                            z_color = (0, 255, 255)  # Yellow
                        else:
                            z_color = (0, 255, 0)  # Green
                        
                        # Draw zone rectangle
                        cv2.rectangle(overlay, (z_x1, z_y1), (z_x2, z_y2), z_color, 2)
                        
                        # Zone label
                        zone_label = f"{z_type.upper()} ZONE"
                        cv2.putText(overlay, zone_label, (z_x1 + 5, z_y1 + 20), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, z_color, 2)
                    
                    # Blend overlay with original frame
                    frame = cv2.addWeighted(overlay, 0.8, frame, 0.2, 0)
                
                # Encode frame as JPEG
                ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                if not ret:
                    continue
                
                frame_bytes = buffer.tobytes()
                
                # Yield frame in MJPEG format
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                       
            except GeneratorExit:
                # Client disconnected gracefully
                print(f"🔌 Client disconnected from {camera_id}")
                break
            except Exception as e:
                print(f"⚠️ Frame error for {camera_id}: {e}")
                consecutive_failures += 1
                if consecutive_failures >= max_failures:
                    break
                continue
                
    except GeneratorExit:
        # Client disconnected
        print(f"🔌 Stream disconnected for {camera_id}")
    except Exception as e:
        print(f"❌ Stream error for {camera_id}: {e}")
    finally:
        print(f"🔌 Stream ended for {camera_id}")

def get_active_streams():
    """Get list of active camera streams"""
    return list(camera_streams.keys())
