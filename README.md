# Suraksha-Setu 🛡️

Real-time AI-powered intrusion detection system with multi-camera support using YOLOv8.

## 🎯 Overview

Suraksha-Setu is a comprehensive security monitoring system that uses computer vision and AI to detect human intrusions in restricted zones. It supports multiple cameras, real-time alerts, risk scoring, and provides a complete RESTful API for integration.

## ✨ Features

- 📹 **Multi-camera Management** - Add, monitor, and control multiple camera streams
- 🎯 **Zone-based Detection** - Define custom restricted zones per camera
- 🧠 **AI-Powered Detection** - YOLOv8 for accurate person detection
- ⚠️ **Risk Scoring System** - Intelligent risk assessment (low/medium/high)
- ⚡ **Real-time Alerts** - Instant WebSocket notifications
- 💾 **Persistent Storage** - SQLite database with alert history
- 🖼️ **Frame Capture** - Automatic saving of intrusion frames
- 🔌 **RESTful API** - Complete API for all operations
- 🎨 **Interactive Docs** - Auto-generated Swagger UI

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Webcam or IP camera
- 4GB RAM minimum

### Installation

1. **Clone and navigate:**
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

### First Time Setup

The system will automatically:
- Download YOLOv8 model (yolov8n.pt) on first run
- Create SQLite database
- Initialize storage folders

## 📚 API Documentation

Interactive API docs available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## 🔌 API Endpoints

### 📹 Camera Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cameras` | Add new camera |
| GET | `/api/cameras` | List all cameras |
| GET | `/api/cameras/{camera_id}` | Get camera details |
| DELETE | `/api/cameras/{camera_id}` | Delete camera |

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

### ⚠️ Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts?limit=10` | Get recent alerts |

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
    "camera_id": "cam1",
    "source": "0",
    "location": "Main Gate",
    "type": "restricted"
  }'
```

**Parameters:**
- `camera_id`: Unique identifier
- `source`: Camera source (0 for webcam, URL for IP camera)
- `location`: Physical location name
- `type`: "normal" or "restricted"

### 2. Define Restricted Zone

```bash
curl -X POST http://localhost:8000/api/zones \
  -H "Content-Type: application/json" \
  -d '{
    "camera_id": "cam1",
    "x1": 200,
    "y1": 150,
    "x2": 440,
    "y2": 330
  }'
```

**Zone Coordinates:**
- `(x1, y1)`: Top-left corner
- `(x2, y2)`: Bottom-right corner

### 3. Start Detection

```bash
curl -X POST http://localhost:8000/api/control/start/cam1
```

### 4. Get Alerts

```bash
curl http://localhost:8000/api/alerts?limit=10
```

### 5. WebSocket Connection (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  console.log('Alert received:', alert);
  // {
  //   type: "alert",
  //   camera_id: "cam1",
  //   location: "Main Gate",
  //   risk: 87,
  //   risk_level: "high",
  //   confidence: 0.92,
  //   image: "cam1_20260409_143022.jpg",
  //   message: "Intrusion detected at Main Gate",
  //   timestamp: "2026-04-09T14:30:22.123456"
  // }
};
```

## ⚙️ Configuration

Edit `backend/config.py`:

```python
# Detection Settings
CONFIDENCE_THRESHOLD = 0.6      # Min confidence (0.0-1.0)
COOLDOWN_SECONDS = 5            # Alert cooldown time
FRAME_SKIP = 2                  # Process every Nth frame

# Risk Scoring
RISK_BASE_MULTIPLIER = 100      # Base risk calculation
RISK_ZONE_BONUS = 20            # Bonus for zone intrusion
RISK_LOWLIGHT_BONUS = 10        # Bonus for low-light

# Paths
DB_PATH = "storage/suraksha.db"
ALERT_STORAGE_PATH = "storage/alerts"
YOLO_MODEL_PATH = "yolov8n.pt"
```

## 📁 Project Structure

```
suraksha-setu/
├── backend/
│   ├── main.py                 # FastAPI application entry
│   ├── database.py             # SQLite initialization
│   ├── config.py               # Global configuration
│   │
│   ├── models/                 # Data models
│   │   ├── camera.py           # Camera CRUD operations
│   │   ├── zone.py             # Zone CRUD operations
│   │   └── alert.py            # Alert CRUD operations
│   │
│   ├── routes/                 # API endpoints
│   │   ├── cameras.py          # Camera routes
│   │   ├── zones.py            # Zone routes
│   │   ├── alerts.py           # Alert routes
│   │   └── control.py          # Detection control routes
│   │
│   ├── services/               # Core business logic
│   │   ├── detection.py        # YOLO + OpenCV detection
│   │   ├── websocket.py        # WebSocket manager
│   │   └── risk.py             # Risk scoring engine
│   │
│   ├── storage/                # Data storage (auto-created)
│   │   ├── suraksha.db         # SQLite database
│   │   └── alerts/             # Alert images
│   │
│   ├── requirements.txt        # Python dependencies
│   └── .gitignore
│
├── frontend/                   # Frontend (coming soon)
└── README.md
```

## 🔧 How It Works

1. **Camera Registration**: Add cameras via API with source and location
2. **Zone Definition**: Define rectangular restricted zones for each camera
3. **Detection Start**: Start detection loop for specific camera
4. **Frame Processing**: 
   - Capture frames from camera
   - Skip frames for performance (configurable)
   - Run YOLOv8 person detection
5. **Intrusion Logic**:
   - Check if person's bounding box center is inside zone
   - Only trigger for "restricted" type cameras
   - Apply confidence threshold
6. **Risk Calculation**:
   - Base risk = confidence × 100
   - Add zone bonus (+20)
   - Categorize: low (<40), medium (40-70), high (>70)
7. **Alert Generation**:
   - Save frame to disk
   - Store alert in database
   - Broadcast via WebSocket
8. **Cooldown**: Prevent alert spam with configurable cooldown

## 🎨 Risk Levels

| Risk Score | Level | Color | Action |
|------------|-------|-------|--------|
| 0-39 | Low | 🟢 Green | Monitor |
| 40-69 | Medium | 🟡 Yellow | Alert |
| 70-100 | High | 🔴 Red | Immediate Action |

## 🛠️ Tech Stack

- **Backend Framework**: FastAPI
- **AI/ML**: YOLOv8 (Ultralytics)
- **Computer Vision**: OpenCV
- **Database**: SQLite
- **Real-time**: WebSockets
- **Language**: Python 3.10

## 📊 Database Schema

### Cameras Table
```sql
- id (INTEGER PRIMARY KEY)
- camera_id (TEXT UNIQUE)
- source (TEXT)
- location (TEXT)
- type (TEXT)
- active (INTEGER)
- created_at (TEXT)
```

### Zones Table
```sql
- id (INTEGER PRIMARY KEY)
- camera_id (TEXT)
- x1, y1, x2, y2 (INTEGER)
```

### Alerts Table
```sql
- id (INTEGER PRIMARY KEY)
- camera_id (TEXT)
- location (TEXT)
- risk (INTEGER)
- confidence (REAL)
- image_path (TEXT)
- message (TEXT)
- timestamp (TEXT)
```

## 🚦 Performance Tips

1. **Frame Skip**: Increase `FRAME_SKIP` for slower systems
2. **Resolution**: Use lower resolution cameras for better FPS
3. **Multiple Cameras**: Each camera runs in separate async task
4. **Cooldown**: Adjust `COOLDOWN_SECONDS` to reduce alert frequency

## 🔒 Security Notes

- System runs locally, no cloud dependency
- Alert images stored locally in `storage/alerts/`
- Database stored locally in `storage/suraksha.db`
- WebSocket connections are not authenticated (add auth for production)

## 🐛 Troubleshooting

**Camera not detected:**
- Check camera source (0 for webcam, URL for IP camera)
- Ensure camera is not being used by another application

**No alerts generated:**
- Verify camera type is "restricted"
- Check if zones are properly defined
- Ensure person is inside the zone
- Check confidence threshold in config

**High CPU usage:**
- Increase `FRAME_SKIP` value
- Use smaller camera resolution
- Reduce number of active cameras

**"Camera index out of range" error:**
- No camera connected at that source index
- Camera already in use by another app (close other apps)
- For mobile camera: Install DroidCam/iVCam first
- Try different source: "0", "1", etc.
- For IP camera: Use full URL like "http://192.168.1.100:8080/video"

## 📝 License

MIT License - Feel free to use for personal and commercial projects.

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Made with ❤️ for better security monitoring**
