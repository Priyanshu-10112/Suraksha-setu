// WebSocket service — connects to backend WSS endpoint
// Auto-reconnects with exponential backoff on disconnect.

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
const RECONNECT_DELAY = 3000
const MAX_RECONNECT_DELAY = 30000
const MAX_RETRIES = 10

let ws = null
let listeners = []
let reconnectTimer = null
let shouldConnect = false
let reconnectAttempts = 0
let currentDelay = RECONNECT_DELAY

function notifyListeners(event) {
  listeners.forEach(fn => fn(event))
}

export function connectSocket() {
  shouldConnect = true
  reconnectAttempts = 0
  currentDelay = RECONNECT_DELAY
  _connect()
}

export function disconnectSocket() {
  shouldConnect = false
  clearTimeout(reconnectTimer)
  if (ws) { ws.close(); ws = null }
}

export function addSocketListener(fn) {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}

function _connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  // Stop retrying after max attempts
  if (reconnectAttempts >= MAX_RETRIES) {
    console.warn('WebSocket: Max reconnection attempts reached. Stopping.')
    shouldConnect = false
    return
  }

  try {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      reconnectAttempts = 0
      currentDelay = RECONNECT_DELAY
      notifyListeners({ type: 'connected' })
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        // Backend sends { type: "alert", camera_id, location, risk, risk_level,
        //                  confidence, image, message, timestamp }
        if (data.type === 'alert') {
          notifyListeners({ type: 'alert', payload: data })
        }
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = () => {
      notifyListeners({ type: 'disconnected' })
      ws = null
      if (shouldConnect) {
        reconnectAttempts++
        // Exponential backoff
        currentDelay = Math.min(currentDelay * 1.5, MAX_RECONNECT_DELAY)
        reconnectTimer = setTimeout(_connect, currentDelay)
      }
    }

    ws.onerror = () => {
      // Silently close - onclose will handle reconnection
      ws?.close()
    }
  } catch (error) {
    console.error('WebSocket connection error:', error)
    if (shouldConnect) {
      reconnectAttempts++
      currentDelay = Math.min(currentDelay * 1.5, MAX_RECONNECT_DELAY)
      reconnectTimer = setTimeout(_connect, currentDelay)
    }
  }
}

