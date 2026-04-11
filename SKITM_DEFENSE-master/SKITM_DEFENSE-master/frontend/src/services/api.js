// Centralized API service — Suraksha-Setu backend
// Base URL from .env → VITE_API_URL (ngrok or localhost)

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const API_BASE = BASE

// ── URL helpers ───────────────────────────────────────────────────────────────

// Alert images: GET /images/{filename}
export function getImageUrl(filename) {
  if (!filename) return null
  return `${BASE}/images/${filename}`
}

// MJPEG live stream: GET /api/stream/video_feed/{camera_id}
export function getStreamUrl(cameraId) {
  return `${BASE}/api/stream/video_feed/${cameraId}`
}

// Frame snapshot for zone drawing (same MJPEG endpoint)
export function getFrameUrl(cameraId) {
  return `${BASE}/api/stream/video_feed/${cameraId}`
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // bypass ngrok/localtunnel browser warning page
      'ngrok-skip-browser-warning': 'true',
      'bypass-tunnel-reminder': 'true',
    },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Health ────────────────────────────────────────────────────────────────────
// GET /  → { status, service, version }
export const healthCheck = () => request('GET', '/')

// ── Cameras ───────────────────────────────────────────────────────────────────
// GET    /api/cameras/         → { cameras: [{ camera_id, source, location, type, active }] }
// POST   /api/cameras/         → { status, camera }
// GET    /api/cameras/{id}     → { camera }
// DELETE /api/cameras/{id}     → { status, message }
export const getCameras   = ()     => request('GET',    '/api/cameras/')
export const addCamera    = (data) => request('POST',   '/api/cameras/', data)
export const getCamera    = (id)   => request('GET',    `/api/cameras/${id}`)
export const deleteCamera = (id)   => request('DELETE', `/api/cameras/${id}`)

// ── Stream / Camera test ──────────────────────────────────────────────────────
// POST /api/stream/test   body: { source }  → { status, message }
// GET  /api/stream/active                   → { active_streams: [...] }
export const testCamera      = (source)   => request('POST', '/api/stream/test/', { source })
export const getActiveStreams = ()         => request('GET',  '/api/stream/active/')

// ── Zones ─────────────────────────────────────────────────────────────────────
// POST   /api/zones/             body: { camera_id, x1, y1, x2, y2 }
// GET    /api/zones/{camera_id}  → { zones: [{ id, x1, y1, x2, y2 }] }
// DELETE /api/zones/{zone_id}    → { status, message }
export const addZone    = (data)     => request('POST',   '/api/zones/', data)
export const getZones   = (cameraId) => request('GET',    `/api/zones/${cameraId}`)
export const deleteZone = (zoneId)   => request('DELETE', `/api/zones/${zoneId}`)

// ── Detection Control ─────────────────────────────────────────────────────────
// POST /api/control/start/{camera_id}  → { status, message }
// POST /api/control/stop/{camera_id}   → { status, message }
// GET  /api/control/active             → { active_cameras: [...] }
export const startDetection   = (cameraId) => request('POST', `/api/control/start/${cameraId}`)
export const stopDetection    = (cameraId) => request('POST', `/api/control/stop/${cameraId}`)
export const getActiveCameras = ()         => request('GET',  '/api/control/active/')

// ── Detection Settings ────────────────────────────────────────────────────────
// POST /api/settings/  body: { camera_id, confidence, cooldown }
export const updateSettings = (data) => request('POST', '/api/settings/', data)

// ── Alerts ────────────────────────────────────────────────────────────────────
// GET /api/alerts/?limit={n}
// → { alerts: [{ id, camera_id, location, risk, confidence, image_path, message, timestamp }] }
export const getAlerts = (limit = 10) => request('GET', `/api/alerts/?limit=${limit}`)
