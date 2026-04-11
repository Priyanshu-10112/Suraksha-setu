# Alert Image Display Guide

## Backend Setup (Already Done ✅)

### 1. Images are Saved
- Location: `backend/storage/alerts/`
- Format: `{camera_id}_{timestamp}.jpg`
- Example: `CAM1_20260410_124454.jpg`

### 2. Images are Served
- Endpoint: `http://localhost:8000/images/{image_filename}`
- Static file serving configured in `main.py`
- CORS enabled for cross-origin access

### 3. Alert Response Includes Image Path
```json
{
  "id": 75,
  "camera_id": "CAM1",
  "location": "FLOOR",
  "risk": 78,
  "confidence": 0.78,
  "image_path": "CAM1_20260410_124454.jpg",  // ← Use this
  "message": "⚠️ INTRUSION ALERT...",
  "timestamp": "2026-04-10T12:44:54.889442",
  "zone_type": "restricted",
  "alert_type": "intrusion"
}
```

## Frontend Implementation

### React Example

```jsx
function AlertCard({ alert }) {
  const imageUrl = `http://localhost:8000/images/${alert.image_path}`;
  
  return (
    <div className="alert-card">
      {/* Alert Image with Bounding Box */}
      <div className="alert-image-container">
        <img 
          src={imageUrl} 
          alt={`Alert from ${alert.camera_id}`}
          className="alert-image"
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg'; // Fallback
          }}
        />
        <div className="image-overlay">
          <span className="camera-badge">{alert.camera_id}</span>
          <span className={`risk-badge ${getRiskClass(alert.risk)}`}>
            {alert.risk}% Risk
          </span>
        </div>
      </div>
      
      {/* Alert Details */}
      <div className="alert-details">
        <h3>{alert.location}</h3>
        <p className="alert-message">{alert.message}</p>
        <div className="alert-meta">
          <span className="timestamp">
            {new Date(alert.timestamp).toLocaleString()}
          </span>
          <span className={`zone-type ${alert.zone_type}`}>
            {alert.zone_type.toUpperCase()}
          </span>
          <span className="confidence">
            {Math.round(alert.confidence * 100)}% Confidence
          </span>
        </div>
      </div>
    </div>
  );
}

function getRiskClass(risk) {
  if (risk >= 70) return 'high';
  if (risk >= 40) return 'medium';
  return 'low';
}
```

### Vue Example

```vue
<template>
  <div class="alert-card">
    <!-- Alert Image -->
    <div class="alert-image-container">
      <img 
        :src="imageUrl" 
        :alt="`Alert from ${alert.camera_id}`"
        class="alert-image"
        @error="handleImageError"
      />
      <div class="image-overlay">
        <span class="camera-badge">{{ alert.camera_id }}</span>
        <span :class="['risk-badge', riskClass]">
          {{ alert.risk }}% Risk
        </span>
      </div>
    </div>
    
    <!-- Alert Details -->
    <div class="alert-details">
      <h3>{{ alert.location }}</h3>
      <p class="alert-message">{{ alert.message }}</p>
      <div class="alert-meta">
        <span class="timestamp">{{ formattedTime }}</span>
        <span :class="['zone-type', alert.zone_type]">
          {{ alert.zone_type.toUpperCase() }}
        </span>
        <span class="confidence">
          {{ Math.round(alert.confidence * 100) }}% Confidence
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['alert'],
  computed: {
    imageUrl() {
      return `http://localhost:8000/images/${this.alert.image_path}`;
    },
    riskClass() {
      if (this.alert.risk >= 70) return 'high';
      if (this.alert.risk >= 40) return 'medium';
      return 'low';
    },
    formattedTime() {
      return new Date(this.alert.timestamp).toLocaleString();
    }
  },
  methods: {
    handleImageError(e) {
      e.target.src = '/placeholder-image.jpg';
    }
  }
};
</script>
```

### Vanilla JavaScript

```javascript
function createAlertCard(alert) {
  const imageUrl = `http://localhost:8000/images/${alert.image_path}`;
  
  const card = document.createElement('div');
  card.className = 'alert-card';
  
  card.innerHTML = `
    <div class="alert-image-container">
      <img 
        src="${imageUrl}" 
        alt="Alert from ${alert.camera_id}"
        class="alert-image"
        onerror="this.src='/placeholder-image.jpg'"
      />
      <div class="image-overlay">
        <span class="camera-badge">${alert.camera_id}</span>
        <span class="risk-badge ${getRiskClass(alert.risk)}">
          ${alert.risk}% Risk
        </span>
      </div>
    </div>
    
    <div class="alert-details">
      <h3>${alert.location}</h3>
      <p class="alert-message">${alert.message}</p>
      <div class="alert-meta">
        <span class="timestamp">${new Date(alert.timestamp).toLocaleString()}</span>
        <span class="zone-type ${alert.zone_type}">${alert.zone_type.toUpperCase()}</span>
        <span class="confidence">${Math.round(alert.confidence * 100)}% Confidence</span>
      </div>
    </div>
  `;
  
  return card;
}

function getRiskClass(risk) {
  if (risk >= 70) return 'high';
  if (risk >= 40) return 'medium';
  return 'low';
}
```

## CSS Styling

```css
.alert-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.alert-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.alert-image-container {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
  background: #f3f4f6;
}

.alert-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.camera-badge {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.risk-badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.risk-badge.low {
  background: rgba(16, 185, 129, 0.9);
  color: white;
}

.risk-badge.medium {
  background: rgba(245, 158, 11, 0.9);
  color: white;
}

.risk-badge.high {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.alert-details {
  padding: 16px;
}

.alert-details h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.alert-message {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.alert-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
}

.timestamp {
  color: #9ca3af;
}

.zone-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

.zone-type.normal {
  background: #d1fae5;
  color: #065f46;
}

.zone-type.safe {
  background: #dbeafe;
  color: #1e40af;
}

.zone-type.restricted {
  background: #fee2e2;
  color: #991b1b;
}

.confidence {
  color: #6b7280;
}
```

## Modal/Lightbox for Full Image View

```jsx
function AlertImageModal({ alert, onClose }) {
  const imageUrl = `http://localhost:8000/images/${alert.image_path}`;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <img 
          src={imageUrl} 
          alt="Alert Detail"
          className="modal-image"
        />
        
        <div className="modal-info">
          <h2>{alert.camera_id} - {alert.location}</h2>
          <p>{alert.message}</p>
          <div className="modal-meta">
            <span>Risk: {alert.risk}%</span>
            <span>Confidence: {Math.round(alert.confidence * 100)}%</span>
            <span>{new Date(alert.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Usage
function AlertCard({ alert }) {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <div className="alert-card" onClick={() => setShowModal(true)}>
        {/* Card content */}
      </div>
      
      {showModal && (
        <AlertImageModal alert={alert} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
```

## Image Gallery View

```jsx
function AlertGallery({ alerts }) {
  return (
    <div className="alert-gallery">
      {alerts.map(alert => (
        <div key={alert.id} className="gallery-item">
          <img 
            src={`http://localhost:8000/images/${alert.image_path}`}
            alt={`Alert ${alert.id}`}
            className="gallery-image"
          />
          <div className="gallery-overlay">
            <span className="gallery-camera">{alert.camera_id}</span>
            <span className={`gallery-risk ${getRiskClass(alert.risk)}`}>
              {alert.risk}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

```css
.alert-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  padding: 16px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.gallery-item:hover {
  transform: scale(1.05);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gallery-camera {
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.gallery-risk {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
```

## Image Features in Saved Files

Each saved image includes:
- ✅ Red bounding box around detected person
- ✅ Alert type label (INTRUSION/PRESENCE)
- ✅ Original frame with detection overlay
- ✅ Timestamp in filename

## Testing

```bash
# Check if images exist
ls backend/storage/alerts/

# View image in browser
http://localhost:8000/images/CAM1_20260410_124454.jpg

# Get alerts with image paths
curl http://localhost:8000/api/alerts?limit=10
```

## Important Notes

1. **Image URL Format:**
   ```
   http://localhost:8000/images/{image_path}
   ```
   OR on same WiFi:
   ```
   http://172.16.0.21:8000/images/{image_path}
   ```

2. **CORS Enabled:** Images accessible from any origin

3. **Image Contains:**
   - Original camera frame
   - Red bounding box on detected person
   - Alert type label

4. **Error Handling:** Always provide fallback image for missing files

5. **Performance:** Images are ~50-200KB each, loads fast

---

**Backend already serving images!** Frontend ko bas `image_path` use karke display karna hai. 🖼️
