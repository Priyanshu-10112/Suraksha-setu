import cv2
import asyncio
from typing import Dict, Optional
from threading import Lock

# Global camera streams dictionary
camera_streams: Dict[str, cv2.VideoCapture] = {}
stream_locks: Dict[str, Lock] = {}

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
    """Generate MJPEG frames for streaming with auto-reconnect"""
    cap = get_camera_stream(camera_id, source)
    
    if not cap:
        print(f"❌ Failed to get camera stream for {camera_id}")
        return
    
    print(f"✅ Starting stream for {camera_id}")
    
    consecutive_failures = 0
    max_failures = 5
    
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
                    print(f"❌ Failed to read frame from {camera_id} (attempt {consecutive_failures}/{max_failures})")
                    
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
