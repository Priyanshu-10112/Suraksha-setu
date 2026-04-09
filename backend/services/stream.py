import cv2
import asyncio
from typing import Dict, Optional
from threading import Lock

# Global camera streams dictionary
camera_streams: Dict[str, cv2.VideoCapture] = {}
stream_locks: Dict[str, Lock] = {}

def get_camera_stream(camera_id: str, source: str) -> Optional[cv2.VideoCapture]:
    """Get or create camera stream"""
    if camera_id not in camera_streams:
        # Convert source to int if it's a number
        try:
            source = int(source)
        except:
            pass
        
        cap = cv2.VideoCapture(source)
        if cap.isOpened():
            camera_streams[camera_id] = cap
            stream_locks[camera_id] = Lock()
            return cap
        return None
    
    return camera_streams[camera_id]

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
    """Generate MJPEG frames for streaming"""
    cap = get_camera_stream(camera_id, source)
    
    if not cap:
        print(f"❌ Failed to get camera stream for {camera_id}")
        return
    
    print(f"✅ Starting stream for {camera_id}")
    
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
                        print(f"❌ Failed to read frame from {camera_id}")
                        break
                    
                    # Encode frame as JPEG
                    ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                    if not ret:
                        print(f"❌ Failed to encode frame for {camera_id}")
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
