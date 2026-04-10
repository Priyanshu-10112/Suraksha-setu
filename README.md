# Suraksha-Setu 🛡️

AI-powered intrusion detection system with real-time person detection, zone-based monitoring, criminal face recognition, and live video feed with color-coded alerts.

## 🎯 Overview

Suraksha-Setu uses YOLOv8 for real-time person detection across multiple camera feeds. It features zone-based intrusion detection with three zone types (normal, safe, restricted), criminal face recognition, advanced tracking, risk scoring, and live video streams with color-coded bounding boxes.

## ✨ Features

- 📹 **Multi-camera Support** - Monitor multiple cameras simultaneously
- 🎯 **Zone-based Detection** - Three zone types: Normal, Safe, Restricted
- 🔐 **Face Recognition** - Identify known criminals/terrorists (NEW)
- 🧠 **YOLOv8 Person Detection** - Accurate real-time detection
- 📊 **Advanced Tracking** - IoU-based tracking with 3-frame confirmation
- ⚠️ **Smart Risk Scoring** - Dynamic risk calculation (0-100)
- 🎨 **Live Video Feed** - Color-coded bounding boxes (Green/Yellow/Red)
- 🔴 **Zone Visualization** - Real-time zone overlays on video
- ⚡ **WebSocket Alerts** - Instant real-time notifications
- 💾 **Alert History** - SQLite database with captured frames
- 🔌 **RESTful API** - Complete API with Swagger docs
- 🔄 **Auto-reconnect** - Automatic camera recovery on failures

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Camera (Webcam/DroidCam/IP Camera)
- 4GB RAM minimum

### Installation

1. **Navigate to backend:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Run server:**
```bash
python main.py
```

Server starts at `http://localhost:8000` 🎉

### First Run
- YOLOv8 model downloads automatically
- Database and storage folders created
- Ready to add cameras

## 📚 API Documentation

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## 🔌 API Endpoints

### 📹 Camera Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cameras` | Add new camera |
| GET | `/api/cameras` | List all cameras |
| GET | `/api/cameras/{camera_id}` | Get camera details |
| DELETE | `/api/cameras/{camera_id}` | Delete camera + zones |

### 🎯 Zone Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/zones` | Add zone to camera |
| GET | `/api/zones/{camera_id}` | Get zones for camera |
| DELETE | `/api/zones/{zone_id}` | Delete zone |

### 🎮 Detection Control

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/control/start/{camera_id}` | Start detection |
| POST | `/api/control/stop/{camera_id}` | Stop detection |
| GET | `/api/control/active` | Get active cameras |

### 📺 Video Stream

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stream/video_feed/{camera_id}` | Live MJPEG stream with detection |
| POST | `/api/stream/test` | Test camera source |
| GET | `/api/stream/health/{camera_id}` | Camera health check |

### ⚠️ Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts?limit=10` | Get recent alerts |

### 🔐 Face Recognition (NEW)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/criminals/` | Get list of all criminals |
| GET | `/api/criminals/status` | Check face recognition status |
| POST | `/api/criminals/reload` | Reload criminal database |

### 🔌 WebSocket

| Endpoint | Description |
|----------|-------------|
| `WS /ws` | Real-time alert stream |

## 💡 Usage Examples

### 1. Add Camera

```bash
curl -X POST http://localhost:8000/api/cameras \
  -H "Content-Type: application/json" \
  -d '{
    "camera_id": "CAM1",
    "source": "0",
    "location": "Main Gate",
    "type": "security"
  }'
```

**Camera Sources:**
- `"0"` - Laptop webcam
- `"1"` - DroidCam (install DroidCam app first)
- `"http://192.168.1.100:8080/video"` - IP Camera URL

### 2. Define Zone

```bash
curl -X POST http://localhost:8000/api/zones \
  -H "Content-Type: application/json" \
  -d '{
    "camera_id": "CAM1",
    "x1": 200,
    "y1": 150,
    "x2": 440,
    "y2": 330,
    "zone_type": "restricted"
  }'
```

**Zone Types:**
- `"normal"` - No alerts, green boxes
- `"safe"` - Presence alerts, yellow boxes
- `"restricted"` - Intrusion alerts, red boxes

### 3. Start Detection

```bash
curl -X POST http://localhost:8000/api/control/start/CAM1
```

### 4. View Live Feed

Open in browser:
```
http://localhost:8000/api/stream/video_feed/CAM1
```

Features:
- Real-time person detection
- Color-coded bounding boxes
- Zone overlays
- Confidence percentages

### 5. Get Alerts

```bash
curl http://localhost:8000/api/alerts?limit=20
```

### 6. WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  console.log('Alert:', alert);
  
  // Criminal Alert
  if (alert.type === "criminal_detected") {
    console.log('🚨 CRIMINAL:', alert.suspect_name);
    console.log('Face Match:', alert.face_confidence);
  }
  
  // Normal Alert
  // {
  //   type: "alert",
  //   camera_id: "CAM1",
  //   location: "Main Gate",
  //   risk: 89,
  //   risk_level: "high",
  //   confidence: 0.87,
  //   image: "CAM1_20260410_143022.jpg",
  //   message: "⚠️ INTRUSION ALERT - Camera 'CAM1' at Main Gate...",
  //   timestamp: "2026-04-10T14:30:22",
  //   zone_type: "restricted",
  //   alert_type: "intrusion"
  // }
};
```

### 7. Face Recognition Setup (NEW)

**Add Criminal Photos:**

1. Create folder structure:
```bash
cd backend/dataset/criminals
mkdir Rabbu_Bagri
mkdir Lovekush
mkdir Priyanshu
```

2. Add photos to each folder:
```
criminals/
├── Rabbu_Bagri/
│   ├── photo1.jpg
│   ├── photo2.jpg
│   └── photo3.jpg
├── Lovekush/
│   └── photo1.jpg
└── Priyanshu/
    └── photo1.jpg
```

3. Reload database (no restart needed):
```bash
curl -X POST http://localhost:8000/api/criminals/reload
```

4. Check status:
```bash
curl http://localhost:8000/api/criminals/status
```

**Photo Guidelines:**
- Front-facing, clear photos
- Good lighting
- Multiple photos per person (3-5 recommended)
- Formats: .jpg, .jpeg, .png

**Criminal Detection:**
- When criminal detected → HIGH PRIORITY alert
- Risk: Always 100
- Alert type: "criminal_detected"
- Image marked with "_CRIMINAL" suffix
- Includes suspect name and face confidence

## ⚙️ Configuration

Edit `backend/config.py`:

```python
# Detection Settings
CONFIDENCE_THRESHOLD = 0.5      # Min confidence (lowered for better detection)
COOLDOWN_SECONDS = 5            # Alert cooldown time
FRAME_SKIP = 2                  # Process every Nth frame

# Tracking Settings
TRACKING_IOU_THRESHOLD = 0.3    # IoU threshold for tracking
TRACKING_MAX_AGE = 5            # Frames to keep track
TRACKING_MIN_HITS = 3           # Min detections to confirm

# Zone Settings
ZONE_IOA_THRESHOLD = 0.15       # Min 15% overlap to trigger
ZONE_MARGIN = 0.05              # 5% zone margin

# Filter Settings
EDGE_MARGIN = 0.0               # Edge filter (disabled)
MIN_BBOX_WIDTH = 30             # Min box width
MIN_BBOX_HEIGHT = 30            # Min box height

# Risk Scoring
RISK_BASE_MULTIPLIER = 100
RISK_ZONE_BONUS = 20
RISK_STABILITY_BONUS = 10
RISK_EDGE_PENALTY = 10
```

## 📁 Project Structure

```
suraksha-setu/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── database.py             # SQLite setup
│   ├── config.py               # Configuration
│   │
│   ├── models/                 # Data models
│   │   ├── camera.py           # Camera CRUD
│   │   ├── zone.py             # Zone CRUD
│   │   └── alert.py            # Alert CRUD
│   │
│   ├── routes/                 # API routes
│   │   ├── cameras.py
│   │   ├── zones.py
│   │   ├── alerts.py
│   │   ├── control.py
│   │   ├── stream.py           # Video streaming
│   │   └── face_recognition.py # Face recognition API (NEW)
│   │
│   ├── services/               # Core logic
│   │   ├── detection.py        # Main detection loop
│   │   ├── stream.py           # Camera streaming
│   │   ├── tracking.py         # Object tracking
│   │   ├── filters.py          # Detection filters
│   │   ├── zone_utils.py       # Zone calculations
│   │   ├── motion.py           # Motion detection
│   │   ├── risk.py             # Risk scoring
│   │   ├── websocket.py        # WebSocket manager
│   │   └── face_recognition_service.py  # Face recognition (NEW)
│   │
│   ├── dataset/                # Face recognition dataset (NEW)
│   │   └── criminals/          # Criminal photos
│   │       ├── Rabbu_Bagri/
│   │       ├── Lovekush/
│   │       └── Priyanshu/
│   │
│   ├── storage/                # Auto-created
│   │   ├── suraksha.db         # Database
│   │   └── alerts/             # Alert images
│   │
│   ├── requirements.txt
│   └── yolov8n.pt             # YOLO model (auto-downloaded)
│
├── FRONTEND_FACE_RECOGNITION_GUIDE.md  # Frontend integration guide
├── API_ENDPOINTS_SUMMARY.md            # API quick reference
└── README.md
```

## 🔧 How It Works

### Detection Pipeline

1. **Camera Stream**: Shared camera access with thread-safe locks
2. **Frame Processing**: Every 2nd frame (configurable)
3. **YOLO Detection**: Person detection with confidence threshold
4. **Face Recognition**: Check if person is known criminal (every 5th frame)
5. **Filtering**: Edge, size, and confidence filters
6. **Tracking**: IoU-based tracking with 3-frame confirmation
7. **Zone Check**: Calculate Intersection over Area (IoA)
8. **Risk Calculation**: Multi-factor risk scoring
9. **Alert Generation**: Save frame, database entry, WebSocket broadcast

### Alert Types

| Alert Type | Trigger | Risk | Priority |
|------------|---------|------|----------|
| Criminal Detected | Known criminal identified | 100 | 🚨 CRITICAL |
| Intrusion | Person in restricted zone | 50-100 | ⚠️ HIGH |
| Presence | Person in safe zone | 10-50 | ℹ️ MEDIUM |

### Zone Types & Alerts

| Zone Type | Alert Type | Box Color | Risk Bonus |
|-----------|------------|-----------|------------|
| Normal | None | 🟢 Green | +0 |
| Safe | Presence | 🟡 Yellow | +10 |
| Restricted | Intrusion | 🔴 Red | +30 |
| Criminal | Criminal Detected | 🔴 Red | +100 |

### Risk Scoring

```
Base Risk = Confidence × 100
+ Zone fully inside bonus (+20)
+ Stable tracking bonus (+10)
- Near boundary penalty (-10)
= Final Risk (0-100)
```

**Risk Levels:**
- 0-39: Low (🟢)
- 40-69: Medium (🟡)
- 70-100: High (🔴)

## 🎨 Live Video Features

The live video feed (`/api/stream/video_feed/{camera_id}`) shows:

- **Real-time Detection**: Person detection every 2 frames
- **Color-coded Boxes**:
  - Green: Person in normal zone
  - Yellow: Person in safe zone
  - Red: Person in restricted zone
- **Zone Overlays**: Semi-transparent zone boundaries
- **Labels**: "PERSON 85%", "PRESENCE 92%", "INTRUSION 78%"
- **Zone Labels**: "NORMAL ZONE", "SAFE ZONE", "RESTRICTED ZONE"

## 🛠️ Tech Stack

- **Backend**: FastAPI
- **AI/ML**: YOLOv8 (Ultralytics)
- **Computer Vision**: OpenCV
- **Database**: SQLite
- **Real-time**: WebSockets
- **Language**: Python 3.10

## 📊 Database Schema

### Cameras
```sql
- id, camera_id (UNIQUE), source, location, type, active, created_at
```

### Zones
```sql
- id, camera_id (FK), x1, y1, x2, y2, zone_type
```

### Alerts
```sql
- id, camera_id (FK), location, risk, confidence
- image_path, message, timestamp, zone_type, alert_type
- suspect_name (nullable), face_confidence (nullable)  # NEW
```

**Note:** Deleting a camera automatically deletes its zones.

## 🚦 Performance Tips

1. **Frame Skip**: Increase for slower systems (default: 2)
2. **Resolution**: Lower resolution = better FPS
3. **Confidence**: Higher threshold = fewer false positives
4. **IoA Threshold**: Lower = more sensitive detection
5. **Multiple Cameras**: Each runs in separate async task

## 🔒 Security Notes

- Runs locally, no cloud dependency
- Alert images stored in `storage/alerts/`
- Database in `storage/suraksha.db`
- Add authentication for production use

## 🐛 Troubleshooting

**Camera not opening:**
- Check source: "0" (webcam), "1" (DroidCam)
- Close other apps using camera
- For DroidCam: Install app and start server first

**No alerts:**
- Check zone type (must be "safe" or "restricted")
- Verify person is inside zone (check IoA in logs)
- Lower confidence threshold in config

**Criminal not detected:**
- Check face recognition status: `GET /api/criminals/status`
- Verify photos are loaded (check server logs)
- Ensure face is clearly visible and front-facing
- Add multiple photos per person for better accuracy

**Stream not loading:**
- Check camera is added: `GET /api/cameras`
- Start detection first: `POST /api/control/start/{camera_id}`
- Check browser supports MJPEG

**High CPU:**
- Increase `FRAME_SKIP` (2 → 3 or 4)
- Use lower camera resolution
- Reduce active cameras
- Face recognition runs every 5th frame (already optimized)

**Orphan zones error:**
- Fixed: Deleting camera now auto-deletes zones
- Manual cleanup: Delete zones before camera

## 📝 Multi-Camera Setup

For multiple cameras, use unique sources:

```bash
# Camera 1: Laptop webcam
{"camera_id": "CAM1", "source": "0", ...}

# Camera 2: DroidCam
{"camera_id": "CAM2", "source": "1", ...}

# Camera 3: IP Camera
{"camera_id": "CAM3", "source": "http://192.168.1.100:8080/video", ...}
```

**Important:** Each camera needs a unique source. Don't use same source for multiple cameras.

## 📧 Support

For issues, check logs or open a GitHub issue.

## 📚 Additional Documentation

- **Frontend Integration**: See `FRONTEND_FACE_RECOGNITION_GUIDE.md`
- **API Reference**: See `API_ENDPOINTS_SUMMARY.md`
- **Face Recognition Setup**: See `backend/FACE_RECOGNITION_GUIDE.md`
- **Quick Start Guide**: See `QUICK_START_FACE_RECOGNITION.md`

---

**Built with ❤️ for intelligent security monitoring**
