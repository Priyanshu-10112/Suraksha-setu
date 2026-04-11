# SurakshaSetu — सुरक्षा सेतु

**AI-Powered Border & Public Surveillance System**  
React 18 · Vite 5 · Framer Motion · WebSocket · FastAPI Backend · Bilingual EN/हिं

---

## ✨ Features

### 🎨 UI/UX
- **Dark Theme**: GitHub-inspired dark color scheme
- **Login Animation**: Smooth "Suraksha-Setu" text animation with Indian tricolor emblem
- **Background Animations**: 
  - Electric arcs & centered radar on login pages
  - Canvas wave animation on dashboard pages
- **Responsive Sidebar**: Larger fonts (14px) and icons (16px) for better readability
- **Zone Type Colors**: Visual distinction for restricted/safe/normal zones

### 🔐 Authentication
- **Defense Portal**: Badge ID + Password + Optional OTP
- **Civilian Portal**: Email + Password
- Demo login (any credentials work)

### 📡 Real-time Features
- **WebSocket Alerts**: Live threat notifications with auto-reconnection
- **MJPEG Streaming**: Real-time camera feeds
- **Zone Breach Detection**: Instant alerts for restricted areas
- **Risk Scoring**: Color-coded threat levels (High/Medium/Low)

### 🎯 Core Functionality
- **Camera Management**: Register, test, and control multiple cameras
- **Zone Configuration**: Draw detection zones with type selection (restricted/safe/normal)
- **Alert Center**: Filterable alerts with CSV export
- **Threat Detection**: Real-time analysis with confidence scoring
- **Bilingual Support**: English/Hindi toggle

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Environment Configuration

Create/update `frontend/.env`:

```env
# Local network (recommended for production)
VITE_API_URL=http://172.16.0.21:8000
VITE_WS_URL=ws://172.16.0.21:8000/ws

# Or localhost for development
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

> **Note**: Restart Vite (`npm run dev`) after changing `.env`

---

## 🎭 Demo Login

| Portal   | Field     | Value     |
|----------|-----------|-----------|
| Defense  | Badge ID  | Any value |
| Defense  | Password  | Any value |
| Civilian | Email     | Any email |
| Civilian | Password  | Any value |

---

## 🗺️ Routes

```
/                          → /defense-login

/defense-login             → Defense portal login
/civilian-login            → Civilian portal login

/defense/live              → Live Surveillance (4-camera grid)
/defense/threats           → Threat Detection (primary feed + analytics)
/defense/zones             → Zone Management (map + breach history)
/defense/alerts            → Alert Center (filterable table + export)
/defense/cameras           → Camera Management (5-tab control panel)
/defense/settings          → Camera Controls (start/stop detection)

/civilian/live             → Live Monitoring
/civilian/alerts           → Safety Alerts
/civilian/zones            → Zone View
/civilian/reports          → Incident Reports
```

---

## 📸 Camera Management

Access via `/defense/cameras` - 5 tabs:

### 1. Cameras
- Register new cameras (ID, source, location, type)
- Test camera connection before registration
- List all cameras with status
- Delete cameras

### 2. Live Feed
- Camera switcher dropdown
- MJPEG stream display
- Real-time feed from `/api/stream/video_feed/{id}`

### 3. Zones
- Draw rectangular zones on live feed
- Select zone type: **Restricted** / **Safe** / **Normal**
- Canvas overlay with color coding
- Save to `/api/zones/` with zone_type
- List and delete zones

### 4. Control
- Start/Stop detection per camera
- Confidence threshold slider (0-1)
- Cooldown period slider (seconds)
- Apply settings to backend

### 5. Alerts
- Real-time alert cards (WebSocket + history)
- Alert images with risk scores
- Zone type badges
- Color-coded severity

**Camera Source Formats:**
```
0                                    # Laptop webcam
1                                    # DroidCam (must be running)
http://192.168.x.x:8080/videofeed   # IP Webcam app
```

---

## 🎨 Design System

### Color Palette
```css
--bg:      #0a0e1a  /* Main background */
--navy:    #0d1117  /* Sidebar/topbar */
--panel:   #161b22  /* Cards */
--border:  #30363d  /* Borders */
--saffron: #ff9933  /* Indian flag orange */
--green:   #138808  /* Indian flag green */
--text:    #e6edf3  /* Primary text */
```

### Zone Colors
- **Restricted**: Red (#ef4444) - High security areas
- **Safe**: Green (#22c55e) - Public zones
- **Normal**: Cyan (#00d4ff) - Standard monitoring

### Typography
- **Headings**: Poppins (bold, 800 weight)
- **Body**: Inter (regular, 500 weight)
- **Code**: JetBrains Mono (monospace)
- **Hindi**: Noto Sans Devanagari

---

## 📁 Project Structure

```
frontend/
├── .env                                 # API & WebSocket URLs
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                         # App entry
    ├── App.jsx                          # Router + guards
    ├── index.css                        # Global styles (dark theme)
    ├── background.css                   # Animation layers
    ├── animations.css                   # Keyframes
    ├── context/
    │   └── SurveillanceContext.jsx      # Global state + WebSocket
    ├── services/
    │   ├── api.js                       # REST API calls
    │   └── socket.js                    # WebSocket with auto-reconnect
    ├── components/
    │   ├── TopBar.jsx                   # Header with clock
    │   ├── ElectricBackground.jsx       # Login page animation
    │   ├── WaveBackground.jsx           # Dashboard animation
    │   ├── LoginTransition.jsx          # Post-login animation
    │   ├── RadarPulse.jsx               # Radar rings
    │   ├── DetectionOverlay.jsx         # Threat boxes on video
    │   ├── CameraFeed.jsx               # MJPEG stream
    │   ├── AlertPanel.jsx               # Real-time alerts
    │   ├── CameraControls.jsx           # Start/stop buttons
    │   └── ZoneDrawer.jsx               # Zone drawing canvas
    └── pages/
        ├── DefenseLogin.jsx
        ├── CivilianLogin.jsx
        ├── defense/
        │   ├── Layout.jsx               # Sidebar + routing
        │   ├── LiveSurveillance.jsx     # 4-camera grid
        │   ├── ThreatDetection.jsx      # Primary feed + gauge
        │   ├── ZoneManagement.jsx       # Map + timeline
        │   ├── AlertCenter.jsx          # Table + filters
        │   ├── CameraManagement.jsx     # 5-tab panel
        │   └── Settings.jsx             # Per-camera controls
        └── civilian/
            ├── Layout.jsx
            ├── LiveMonitoring.jsx
            ├── SafetyAlerts.jsx
            ├── ZoneView.jsx
            └── IncidentReports.jsx
```

---

## 🔌 Backend API

Base URL: `http://172.16.0.21:8000`

### Cameras
```
GET    /api/cameras/           → List all cameras
POST   /api/cameras/           → Register camera
DELETE /api/cameras/{id}       → Delete camera
POST   /api/stream/test/       → Test camera source
GET    /api/stream/video_feed/{id}  → MJPEG stream
```

### Zones
```
POST   /api/zones/             → Create zone (with zone_type)
GET    /api/zones/{camera_id}  → Get zones for camera
DELETE /api/zones/{id}         → Delete zone
```

### Detection
```
POST   /api/control/start/{id} → Start detection
POST   /api/control/stop/{id}  → Stop detection
GET    /api/control/active/    → Active cameras
POST   /api/settings/          → Update confidence/cooldown
```

### Alerts
```
GET    /api/alerts/?limit=20   → Alert history
GET    /images/{filename}      → Alert images
WS     /ws                     → Real-time alerts
```

---

## 📡 WebSocket Alert Format

```json
{
  "type": "alert",
  "camera_id": "mobile",
  "location": "Main Gate",
  "risk": 87,
  "risk_level": "high",
  "confidence": 0.92,
  "image": "mobile_20260410_143022.jpg",
  "message": "Intrusion detected in restricted zone",
  "timestamp": "2026-04-10T14:30:22",
  "zone_type": "restricted",
  "alert_type": "intrusion",
  "tracking_info": {
    "track_id": 42,
    "hit_count": 5,
    "zone_overlap": 0.67
  }
}
```

**Risk Levels:**
- `< 40` → Low (green)
- `40-69` → Medium (yellow)
- `≥ 70` → High (red)

---

## 🎬 Animations

### Login Page
- **Electric arcs**: Canvas-based lightning effects
- **Centered radar**: Pulsing rings at 50%, 50%
- **Grid drift**: Animated tactical grid
- **Scan line**: Horizontal glow sweep

### Dashboard
- **Wave animation**: 3-layer canvas sine waves
- **Grid drift**: Slower tactical grid
- **Glassmorphism**: Semi-transparent panels with blur

### Login Transition
- **Emblem**: Rotating tricolor shield (0.8s)
- **Text**: "SURAKSHA SETU" staggered fade-in
- **Hindi subtitle**: "सुरक्षा सेतु" fade
- **Progress bar**: Tricolor loading indicator
- **Duration**: 2 seconds total

---

## 🛠️ Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.2.0 | UI framework |
| react-dom | 18.2.0 | DOM rendering |
| react-router-dom | 6.x | Routing |
| framer-motion | 11.x | Animations |
| vite | 5.2.0 | Build tool |

**Fonts:**
- Poppins (headings)
- Inter (body)
- JetBrains Mono (code)
- Noto Sans Devanagari (Hindi)

---

## 🐛 Troubleshooting

### CORS Errors
1. Check backend is running: `curl http://172.16.0.21:8000/`
2. Verify `.env` has correct URL
3. Restart Vite: `Ctrl+C` then `npm run dev`

### WebSocket Not Connecting
- Check "WS OFF" indicator in sidebar
- Backend must be running on same network
- Use `ws://` not `wss://` for local network

### Camera Not Loading
1. Test source first: POST `/api/stream/test/` with `{"source": "0"}`
2. Verify DroidCam is running (for source "1")
3. Check IP Webcam URL format

### Animations Not Running
- Hard refresh: `Ctrl + Shift + R`
- Check browser console for errors
- Ensure GPU acceleration enabled

---

## 📝 Notes

- **Demo Mode**: Works without backend (cached data)
- **Zone Types**: Must be selected before drawing zone
- **Trailing Slashes**: All API endpoints require `/` at end
- **Image Format**: Alert images are JPEG from `/images/`
- **WebSocket**: Auto-reconnects with exponential backoff (max 10 retries)

---

## 🚀 Production Build

```bash
npm run build
```

Output in `dist/` folder. Serve with any static host.

---

**Last Updated**: April 10, 2026  
**Version**: 2.0  
**Status**: Production Ready ✅
