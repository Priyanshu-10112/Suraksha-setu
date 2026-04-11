# Frontend Alert Status Implementation Guide

## Overview
Alert lifecycle: `new` → `acknowledged` → `resolved` → `deleted`

## API Endpoints

### 1. Get Alerts
```javascript
// Get all alerts
GET /api/alerts?limit=20

// Filter by status
GET /api/alerts?limit=20&status=new
GET /api/alerts?limit=20&status=acknowledged
GET /api/alerts?limit=20&status=resolved

// Response
{
  "alerts": [
    {
      "id": 75,
      "camera_id": "CAM1",
      "location": "FLOOR",
      "risk": 78,
      "confidence": 0.78,
      "image_path": "CAM1_20260410_124454.jpg",
      "message": "⚠️ INTRUSION ALERT - Camera 'CAM1'...",
      "timestamp": "2026-04-10T12:44:54.889442",
      "zone_type": "restricted",
      "alert_type": "intrusion",
      "status": "new"  // ← NEW FIELD
    }
  ],
  "count": 1
}
```

### 2. Get Single Alert
```javascript
GET /api/alerts/{alert_id}

// Response: Same as alert object above
```

### 3. Update Alert Status
```javascript
PATCH /api/alerts/{alert_id}/status
Content-Type: application/json

{
  "status": "acknowledged"  // or "resolved"
}

// Response
{
  "success": true,
  "message": "Alert status updated to 'acknowledged'",
  "previous_status": "new",
  "new_status": "acknowledged"
}
```

### 4. Delete Alert
```javascript
DELETE /api/alerts/{alert_id}

// Response
{
  "success": true,
  "message": "Alert deleted",
  "previous_status": "resolved"
}
```

## UI Implementation

### Button Logic (Single Dynamic Button)

```javascript
function getAlertButton(alert) {
  if (alert.status === "new") {
    return {
      label: "Acknowledge",
      action: () => updateStatus(alert.id, "acknowledged"),
      color: "blue",
      icon: "check"
    };
  } 
  else if (alert.status === "acknowledged") {
    return {
      label: "Resolve",
      action: () => updateStatus(alert.id, "resolved"),
      color: "green",
      icon: "check-circle"
    };
  } 
  else if (alert.status === "resolved") {
    return {
      label: "Delete",
      action: () => deleteAlert(alert.id),
      color: "red",
      icon: "trash"
    };
  }
}

// Update status function
async function updateStatus(alertId, newStatus) {
  try {
    const response = await fetch(`http://localhost:8000/api/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Update UI - refresh alert list or update single alert
      refreshAlerts();
      showNotification(`Alert ${newStatus}`, 'success');
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    showNotification('Failed to update alert', 'error');
  }
}

// Delete function
async function deleteAlert(alertId) {
  if (!confirm('Are you sure you want to delete this alert?')) return;
  
  try {
    const response = await fetch(`http://localhost:8000/api/alerts/${alertId}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Remove from UI
      refreshAlerts();
      showNotification('Alert deleted', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    showNotification('Failed to delete alert', 'error');
  }
}
```

## React Example

```jsx
function AlertCard({ alert, onUpdate }) {
  const [loading, setLoading] = useState(false);
  
  const handleAction = async () => {
    setLoading(true);
    
    try {
      let response;
      
      if (alert.status === "new") {
        response = await fetch(`/api/alerts/${alert.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "acknowledged" })
        });
      } 
      else if (alert.status === "acknowledged") {
        response = await fetch(`/api/alerts/${alert.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "resolved" })
        });
      } 
      else if (alert.status === "resolved") {
        response = await fetch(`/api/alerts/${alert.id}`, {
          method: 'DELETE'
        });
      }
      
      const result = await response.json();
      
      if (result.success) {
        onUpdate(); // Refresh alerts
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getButtonConfig = () => {
    switch (alert.status) {
      case "new":
        return { label: "Acknowledge", color: "blue" };
      case "acknowledged":
        return { label: "Resolve", color: "green" };
      case "resolved":
        return { label: "Delete", color: "red" };
      default:
        return null;
    }
  };
  
  const buttonConfig = getButtonConfig();
  
  return (
    <div className="alert-card">
      <img src={`/images/${alert.image_path}`} alt="Alert" />
      <div className="alert-info">
        <h3>{alert.camera_id} - {alert.location}</h3>
        <p>{alert.message}</p>
        <span className={`status-badge ${alert.status}`}>
          {alert.status.toUpperCase()}
        </span>
        <span className={`risk-badge ${alert.risk > 70 ? 'high' : alert.risk > 40 ? 'medium' : 'low'}`}>
          Risk: {alert.risk}%
        </span>
      </div>
      
      {buttonConfig && (
        <button
          onClick={handleAction}
          disabled={loading}
          className={`btn btn-${buttonConfig.color}`}
        >
          {loading ? 'Processing...' : buttonConfig.label}
        </button>
      )}
    </div>
  );
}
```

## Vue Example

```vue
<template>
  <div class="alert-card">
    <img :src="`/images/${alert.image_path}`" alt="Alert" />
    <div class="alert-info">
      <h3>{{ alert.camera_id }} - {{ alert.location }}</h3>
      <p>{{ alert.message }}</p>
      <span :class="['status-badge', alert.status]">
        {{ alert.status.toUpperCase() }}
      </span>
      <span :class="['risk-badge', riskClass]">
        Risk: {{ alert.risk }}%
      </span>
    </div>
    
    <button
      v-if="buttonConfig"
      @click="handleAction"
      :disabled="loading"
      :class="['btn', `btn-${buttonConfig.color}`]"
    >
      {{ loading ? 'Processing...' : buttonConfig.label }}
    </button>
  </div>
</template>

<script>
export default {
  props: ['alert'],
  data() {
    return {
      loading: false
    };
  },
  computed: {
    buttonConfig() {
      const configs = {
        new: { label: 'Acknowledge', color: 'blue' },
        acknowledged: { label: 'Resolve', color: 'green' },
        resolved: { label: 'Delete', color: 'red' }
      };
      return configs[this.alert.status];
    },
    riskClass() {
      if (this.alert.risk > 70) return 'high';
      if (this.alert.risk > 40) return 'medium';
      return 'low';
    }
  },
  methods: {
    async handleAction() {
      this.loading = true;
      
      try {
        let response;
        
        if (this.alert.status === 'new') {
          response = await this.$http.patch(
            `/api/alerts/${this.alert.id}/status`,
            { status: 'acknowledged' }
          );
        } else if (this.alert.status === 'acknowledged') {
          response = await this.$http.patch(
            `/api/alerts/${this.alert.id}/status`,
            { status: 'resolved' }
          );
        } else if (this.alert.status === 'resolved') {
          response = await this.$http.delete(`/api/alerts/${this.alert.id}`);
        }
        
        if (response.data.success) {
          this.$emit('update');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

## Status Badge Styling

```css
.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.new {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.acknowledged {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.resolved {
  background: #d1fae5;
  color: #065f46;
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.risk-badge.low {
  background: #d1fae5;
  color: #065f46;
}

.risk-badge.medium {
  background: #fef3c7;
  color: #92400e;
}

.risk-badge.high {
  background: #fee2e2;
  color: #991b1b;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-blue {
  background: #3b82f6;
  color: white;
}

.btn-blue:hover:not(:disabled) {
  background: #2563eb;
}

.btn-green {
  background: #10b981;
  color: white;
}

.btn-green:hover:not(:disabled) {
  background: #059669;
}

.btn-red {
  background: #ef4444;
  color: white;
}

.btn-red:hover:not(:disabled) {
  background: #dc2626;
}
```

## Filter Tabs Example

```jsx
function AlertsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [alerts, setAlerts] = useState([]);
  
  const fetchAlerts = async (status = null) => {
    const url = status 
      ? `/api/alerts?limit=50&status=${status}`
      : '/api/alerts?limit=50';
    
    const response = await fetch(url);
    const data = await response.json();
    setAlerts(data.alerts);
  };
  
  useEffect(() => {
    const status = activeTab === 'all' ? null : activeTab;
    fetchAlerts(status);
  }, [activeTab]);
  
  return (
    <div>
      <div className="tabs">
        <button 
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
        >
          All Alerts
        </button>
        <button 
          className={activeTab === 'new' ? 'active' : ''}
          onClick={() => setActiveTab('new')}
        >
          New
        </button>
        <button 
          className={activeTab === 'acknowledged' ? 'active' : ''}
          onClick={() => setActiveTab('acknowledged')}
        >
          Acknowledged
        </button>
        <button 
          className={activeTab === 'resolved' ? 'active' : ''}
          onClick={() => setActiveTab('resolved')}
        >
          Resolved
        </button>
      </div>
      
      <div className="alerts-grid">
        {alerts.map(alert => (
          <AlertCard 
            key={alert.id} 
            alert={alert} 
            onUpdate={() => fetchAlerts(activeTab === 'all' ? null : activeTab)}
          />
        ))}
      </div>
    </div>
  );
}
```

## WebSocket Integration (Real-time Updates)

```javascript
// Connect to WebSocket for real-time alerts
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  
  if (alert.type === 'alert') {
    // New alert received - add to list
    // alert.status will be "new" by default
    addAlertToUI(alert);
    
    // Show notification
    showNotification(`New ${alert.alert_type} alert from ${alert.camera_id}`, 'warning');
    
    // Play sound
    playAlertSound();
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
  // Reconnect logic
  setTimeout(() => connectWebSocket(), 3000);
};
```

## Key Points

1. **Single Dynamic Button**: Button label and action change based on status
2. **Status Flow**: new → acknowledged → resolved → deleted
3. **Direct Resolution**: Can go from "new" directly to "resolved" (skip acknowledge)
4. **Delete Anytime**: Delete button can be shown alongside status button
5. **Real-time**: Use WebSocket for instant new alerts (status: "new")
6. **Filtering**: Use `?status=` query param to filter alerts
7. **Image Path**: Images at `/images/{image_path}` (served by backend)

## Testing

```bash
# Get all alerts
curl http://localhost:8000/api/alerts?limit=10

# Get new alerts only
curl http://localhost:8000/api/alerts?status=new

# Acknowledge alert
curl -X PATCH http://localhost:8000/api/alerts/75/status \
  -H "Content-Type: application/json" \
  -d '{"status": "acknowledged"}'

# Resolve alert
curl -X PATCH http://localhost:8000/api/alerts/75/status \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}'

# Delete alert
curl -X DELETE http://localhost:8000/api/alerts/75
```

## Error Handling

```javascript
async function updateStatus(alertId, newStatus) {
  try {
    const response = await fetch(`/api/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      // Backend validation error
      throw new Error(result.error || 'Failed to update status');
    }
    
    if (result.success) {
      return result;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error updating alert:', error);
    showNotification(error.message, 'error');
    throw error;
  }
}
```

---

**Backend URL:** `http://localhost:8000` (or `http://172.16.0.21:8000` on same WiFi)

**All endpoints ready to use!** 🚀
