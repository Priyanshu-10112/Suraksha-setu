# Frontend Integration Guide - Face Recognition Feature

## 🎯 Overview

Backend ab 3 types ke alerts generate karta hai:
1. **Criminal Alert** - Known criminal detected (NEW)
2. **Intrusion Alert** - Unknown person in restricted zone
3. **Presence Alert** - Unknown person in safe zone

## 📊 Alert Types

### 1. Criminal Alert (High Priority)
```json
{
  "id": 123,
  "type": "criminal_detected",
  "alert_type": "criminal_detected",
  "camera_id": "gate",
  "location": "Main Gate",
  "risk": 100,
  "risk_level": "critical",
  "confidence": 0.78,
  "zone_type": "criminal",
  "suspect_name": "Rabbu_Bagri",
  "face_confidence": 0.85,
  "priority": "HIGH",
  "message": "🚨 CRIMINAL DETECTED - Camera 'gate' at Main Gate identified KNOWN CRIMINAL 'Rabbu_Bagri' at 09:30 PM. IMMEDIATE ACTION REQUIRED! Face Match: 85%, Detection Confidence: 78%",
  "image_path": "gate_20260410_213045_CRIMINAL.jpg",
  "timestamp": "2026-04-10T21:30:45.123456"
}
```

### 2. Normal Intrusion Alert
```json
{
  "id": 124,
  "type": "alert",
  "alert_type": "intrusion",
  "camera_id": "gate",
  "location": "Main Gate",
  "risk": 85,
  "risk_level": "high",
  "confidence": 0.78,
  "zone_type": "restricted",
  "suspect_name": null,
  "face_confidence": null,
  "message": "⚠️ INTRUSION ALERT - Camera 'gate' at Main Gate detected unauthorized person in restricted zone at 09:30 PM...",
  "image_path": "gate_20260410_213045.jpg",
  "timestamp": "2026-04-10T21:30:45.123456"
}
```

### 3. Presence Alert
```json
{
  "id": 125,
  "type": "alert",
  "alert_type": "presence",
  "zone_type": "safe",
  "suspect_name": null,
  "face_confidence": null,
  "message": "ℹ️ PRESENCE ALERT - Camera 'lobby' detected person in safe zone..."
}
```

## 🔑 Key Fields for Frontend

### Criminal Detection Fields (NEW)
- `suspect_name` (string | null) - Criminal ka naam (e.g., "Rabbu_Bagri")
- `face_confidence` (float | null) - Face match confidence (0-1, e.g., 0.85 = 85%)
- `alert_type` - "criminal_detected" for criminals
- `zone_type` - "criminal" for criminal alerts
- `priority` - "HIGH" for criminals
- `risk` - Always 100 for criminals

### How to Identify Criminal Alerts
```javascript
function isCriminalAlert(alert) {
  return alert.alert_type === "criminal_detected" || 
         alert.suspect_name !== null;
}
```

## 🎨 UI Recommendations

### 1. Alert Card Styling

```javascript
function getAlertStyle(alert) {
  if (alert.alert_type === "criminal_detected") {
    return {
      backgroundColor: "#ff0000",  // Red
      borderColor: "#8b0000",      // Dark red
      icon: "🚨",
      priority: "CRITICAL",
      sound: "urgent-alarm.mp3"
    };
  } else if (alert.alert_type === "intrusion") {
    return {
      backgroundColor: "#ff6b00",  // Orange
      borderColor: "#cc5500",
      icon: "⚠️",
      priority: "HIGH",
      sound: "alert.mp3"
    };
  } else {
    return {
      backgroundColor: "#4a90e2",  // Blue
      borderColor: "#357abd",
      icon: "ℹ️",
      priority: "INFO",
      sound: "notification.mp3"
    };
  }
}
```

### 2. Alert Display Component

```jsx
function AlertCard({ alert }) {
  const isCriminal = alert.alert_type === "criminal_detected";
  
  return (
    <div className={`alert-card ${isCriminal ? 'criminal' : ''}`}>
      {/* Header */}
      <div className="alert-header">
        <span className="alert-icon">
          {isCriminal ? "🚨" : alert.alert_type === "intrusion" ? "⚠️" : "ℹ️"}
        </span>
        <span className="alert-type">
          {isCriminal ? "CRIMINAL DETECTED" : alert.alert_type.toUpperCase()}
        </span>
        {isCriminal && <span className="priority-badge">HIGH PRIORITY</span>}
      </div>
      
      {/* Criminal Info */}
      {isCriminal && (
        <div className="criminal-info">
          <div className="suspect-name">
            <strong>Suspect:</strong> {alert.suspect_name}
          </div>
          <div className="face-confidence">
            <strong>Face Match:</strong> {(alert.face_confidence * 100).toFixed(0)}%
          </div>
        </div>
      )}
      
      {/* Location & Time */}
      <div className="alert-details">
        <div><strong>Camera:</strong> {alert.camera_id}</div>
        <div><strong>Location:</strong> {alert.location}</div>
        <div><strong>Time:</strong> {new Date(alert.timestamp).toLocaleString()}</div>
        <div><strong>Risk:</strong> {alert.risk}%</div>
      </div>
      
      {/* Image */}
      <div className="alert-image">
        <img 
          src={`http://localhost:8000/images/${alert.image_path}`} 
          alt="Alert Evidence"
        />
        {isCriminal && <div className="criminal-badge">CRIMINAL</div>}
      </div>
      
      {/* Message */}
      <div className="alert-message">{alert.message}</div>
    </div>
  );
}
```

### 3. Alert Filtering

```javascript
// Get only criminal alerts
const criminalAlerts = alerts.filter(a => a.alert_type === "criminal_detected");

// Get only intrusion alerts
const intrusionAlerts = alerts.filter(a => a.alert_type === "intrusion");

// Get alerts with identified suspects
const identifiedAlerts = alerts.filter(a => a.suspect_name !== null);

// Sort by priority (criminals first)
const sortedAlerts = alerts.sort((a, b) => {
  if (a.alert_type === "criminal_detected") return -1;
  if (b.alert_type === "criminal_detected") return 1;
  return b.risk - a.risk;
});
```

### 4. Real-Time WebSocket Handling

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  
  // Check if criminal alert
  if (alert.type === "criminal_detected") {
    // Play urgent sound
    playUrgentAlarm();
    
    // Show prominent notification
    showCriticalNotification({
      title: "🚨 CRIMINAL DETECTED",
      message: `${alert.suspect_name} identified at ${alert.location}`,
      priority: "critical"
    });
    
    // Flash screen red
    flashScreen("red");
    
    // Add to alerts list at top
    addAlertToTop(alert);
  } else {
    // Normal alert handling
    playNormalAlert();
    showNotification(alert);
    addAlert(alert);
  }
};
```

## 📱 API Endpoints

### Check Face Recognition Status
```javascript
fetch('http://localhost:8000/api/face-recognition/status')
  .then(res => res.json())
  .then(data => {
    console.log('Face Recognition Active:', data.active);
    console.log('Criminals in Database:', data.dataset.persons);
    // ["Rabbu_Bagri", "Lovekush", "Priyanshu"]
  });
```

### Get Dataset Info
```javascript
fetch('http://localhost:8000/api/face-recognition/dataset/info')
  .then(res => res.json())
  .then(data => {
    console.log('Total Criminals:', data.dataset.unique_persons);
    console.log('Criminal Names:', data.dataset.persons);
  });
```

### Reload Dataset (Admin Feature)
```javascript
fetch('http://localhost:8000/api/face-recognition/dataset/reload', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('Dataset reloaded successfully');
    }
  });
```

## 🎨 CSS Styling Examples

```css
/* Criminal Alert - Red Theme */
.alert-card.criminal {
  background: linear-gradient(135deg, #ff0000 0%, #8b0000 100%);
  border: 3px solid #ff0000;
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); }
  50% { box-shadow: 0 0 40px rgba(255, 0, 0, 0.8); }
}

.criminal-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff0000;
  color: white;
  padding: 5px 15px;
  border-radius: 5px;
  font-weight: bold;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.5; }
}

.priority-badge {
  background: #ff0000;
  color: white;
  padding: 3px 10px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 10px;
}

.suspect-name {
  font-size: 18px;
  font-weight: bold;
  color: #ff0000;
  margin: 10px 0;
}

.face-confidence {
  font-size: 14px;
  color: #666;
}
```

## 🔔 Notification Recommendations

### Criminal Alert
- **Sound**: Urgent siren/alarm (loud, attention-grabbing)
- **Duration**: Keep on screen until acknowledged
- **Visual**: Red flashing banner at top
- **Priority**: Always show first in list
- **Auto-focus**: Scroll to criminal alert automatically

### Normal Intrusion
- **Sound**: Standard alert beep
- **Duration**: 10 seconds or until dismissed
- **Visual**: Orange notification
- **Priority**: Normal

### Presence Alert
- **Sound**: Soft notification
- **Duration**: 5 seconds
- **Visual**: Blue info banner
- **Priority**: Low

## 📊 Dashboard Widgets

### 1. Criminal Detection Status Widget
```jsx
function CriminalDetectionWidget() {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    fetch('http://localhost:8000/api/face-recognition/status')
      .then(res => res.json())
      .then(setStatus);
  }, []);
  
  return (
    <div className="widget">
      <h3>🔐 Face Recognition</h3>
      <div className={`status ${status?.active ? 'active' : 'inactive'}`}>
        {status?.active ? '✅ Active' : '❌ Inactive'}
      </div>
      <div className="stats">
        <div>Criminals in Database: {status?.dataset.unique_persons || 0}</div>
        <div>Total Faces: {status?.dataset.total_encodings || 0}</div>
      </div>
      {status?.dataset.persons && (
        <div className="criminal-list">
          <strong>Watchlist:</strong>
          <ul>
            {status.dataset.persons.map(name => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 2. Criminal Alerts Counter
```jsx
function CriminalAlertsCounter({ alerts }) {
  const criminalCount = alerts.filter(
    a => a.alert_type === "criminal_detected"
  ).length;
  
  return (
    <div className="counter criminal-counter">
      <div className="icon">🚨</div>
      <div className="count">{criminalCount}</div>
      <div className="label">Criminal Detections</div>
    </div>
  );
}
```

## 🎯 Important Notes

### Image Paths
- Criminal alerts: `{camera_id}_{timestamp}_CRIMINAL.jpg`
- Normal alerts: `{camera_id}_{timestamp}.jpg`
- Access: `http://localhost:8000/images/{image_path}`

### Risk Levels
- Criminal: Always 100 (CRITICAL)
- Intrusion: 50-100 (MEDIUM to HIGH)
- Presence: 10-50 (LOW to MEDIUM)

### Confidence Values
- `confidence`: YOLO detection confidence (0-1)
- `face_confidence`: Face match confidence (0-1)
- Both should be displayed as percentages

### Alert Priority Order
1. Criminal alerts (alert_type === "criminal_detected")
2. Intrusion alerts (alert_type === "intrusion")
3. Presence alerts (alert_type === "presence")

## 🧪 Testing

### Test Criminal Detection
1. Add Rabbu Bagri's photo to dataset
2. Start detection on camera
3. Show face to camera
4. Check alert:
   - `alert_type` should be "criminal_detected"
   - `suspect_name` should be "Rabbu_Bagri"
   - `face_confidence` should be > 0.6
   - `risk` should be 100

### Test Normal Detection
1. Show unknown person's face
2. Check alert:
   - `alert_type` should be "intrusion" or "presence"
   - `suspect_name` should be null
   - `face_confidence` should be null

## 📞 Support

If criminal alerts not showing:
1. Check face recognition status: `/api/face-recognition/status`
2. Verify dataset loaded: `active: true`
3. Check alert fields: `suspect_name` and `face_confidence`
4. Verify image has "_CRIMINAL" suffix

## 🎉 Summary

**Key Changes for Frontend:**
1. ✅ New alert type: "criminal_detected"
2. ✅ New fields: `suspect_name`, `face_confidence`
3. ✅ Criminal alerts have risk = 100
4. ✅ Image filenames end with "_CRIMINAL.jpg"
5. ✅ New API endpoints for face recognition status
6. ✅ WebSocket sends criminal alerts with type "criminal_detected"

**Display Priority:**
1. 🚨 Criminal alerts (red, urgent)
2. ⚠️ Intrusion alerts (orange, high)
3. ℹ️ Presence alerts (blue, info)

System fully backward compatible - existing alerts work as before!
