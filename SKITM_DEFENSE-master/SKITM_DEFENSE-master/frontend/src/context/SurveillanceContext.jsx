import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { connectSocket, disconnectSocket, addSocketListener } from '../services/socket'

const Ctx = createContext(null)

const MAX_ALERTS = 10
const DEDUP_WINDOW_MS = 3000

export function SurveillanceProvider({ children }) {
  const [user, setUserState]          = useState(() => {
    const savedUser = localStorage.getItem('ss_user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [token, setToken]             = useState(() => localStorage.getItem('ss_token') || '')
  const [systemStatus, setSystemStatus] = useState('OPERATIONAL')
  const [wsConnected, setWsConnected] = useState(false)
  const [lang, setLang]               = useState('en')
  const [mode, setMode]               = useState('Surveillance')
  const [threatLevel, setThreatLevel] = useState(2)

  // All data starts empty — populated from API
  const [cameras, setCameras]         = useState([])
  const [alerts, setAlerts]           = useState([])
  const [civilianAlerts]              = useState([])
  const [reports, setReports]         = useState([])
  const [zones, setZones]             = useState([])
  const [civilianZones]               = useState([])
  const [detections, setDetections]   = useState([])

  const lastAlertTime = useRef({})

  const setUser = useCallback((userData) => {
    setUserState(userData)
    if (userData) {
      localStorage.setItem('ss_user', JSON.stringify(userData))
      if (userData.token) {
        localStorage.setItem('ss_token', userData.token)
        setToken(userData.token)
      }
    } else {
      localStorage.removeItem('ss_user')
      localStorage.removeItem('ss_token')
      setToken('')
    }
  }, [])

  // WebSocket — connect on login, disconnect on logout
  useEffect(() => {
    if (!user) { disconnectSocket(); return }
    connectSocket()
    const unsub = addSocketListener((event) => {
      if (event.type === 'connected')    setWsConnected(true)
      if (event.type === 'disconnected') setWsConnected(false)
      if (event.type === 'alert')        handleWsAlert(event.payload)
    })
    return () => { unsub(); disconnectSocket() }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // WS alert: { type, camera_id, location, risk, risk_level, confidence,
  //             image, message, timestamp, zone_type, alert_type, name, priority }
  const handleWsAlert = useCallback((payload) => {
    const camId = payload.camera_id
    const now   = Date.now()
    if (camId && lastAlertTime.current[camId]) {
      if (now - lastAlertTime.current[camId] < DEDUP_WINDOW_MS) return
    }
    if (camId) lastAlertTime.current[camId] = now

    const ts   = new Date().toLocaleTimeString('en-GB', { hour12: false })
    const risk = payload.risk ?? 0
    const isCriminal = payload.type === 'criminal_detected'
    
    // Debug criminal detection
    if (isCriminal) {
      console.log('🚨 Criminal Detection Alert:', payload)
      console.log('Image path:', payload.image_path || payload.image)
      console.log('Photo URL:', payload.photo_url)
      console.log('Criminal name:', payload.name)
    }
    
    // For criminal detection, try to get detection image first, then fallback to criminal's profile photo
    let alertImage = payload.image_path || payload.image || null
    if (isCriminal && !alertImage && payload.photo_url) {
      alertImage = payload.photo_url
    }
    
    const newAlert = {
      id:         now,
      timestamp:  ts,
      zone:       payload.location  || '—',
      type:       isCriminal ? 'criminal_detected' : (payload.alert_type || 'Intrusion'),
      severity:   isCriminal ? 'Critical' : riskLevelToSeverity(payload.risk_level, risk),
      message:    isCriminal ? `🚨 HIGH THREAT: ${payload.name || 'Unknown Suspect'}` : (payload.message || `Detection on ${camId}`),
      status:     'Active',
      camera_id:  camId,
      location:   payload.location  || '',
      risk_score: isCriminal ? 100 : risk,
      confidence: payload.confidence || 0,
      image:      alertImage,
      image_path: alertImage,
      zone_type:  payload.zone_type  || null,
      alert_type: isCriminal ? 'criminal_detected' : (payload.alert_type || null),
      suspect_name: isCriminal ? payload.name : null,
      priority:   isCriminal ? 'HIGH' : (payload.priority || 'NORMAL'),
    }
    setAlerts(prev => [newAlert, ...prev].slice(0, MAX_ALERTS))
    
    // Play alert sound for criminal detection
    if (isCriminal) {
      setSystemStatus('ALERT')
      try {
        const audio = new Audio('/alert-sound.mp3')
        audio.play().catch(() => {/* ignore if sound fails */})
      } catch (e) {/* ignore */}
    } else if (newAlert.severity === 'Critical') {
      setSystemStatus('ALERT')
    }
  }, [])

  function riskLevelToSeverity(risk_level, risk) {
    if (risk_level === 'high'   || risk >= 70) return 'Critical'
    if (risk_level === 'medium' || risk >= 40) return 'Medium'
    return 'Low'
  }

  const addAlert = useCallback((alert) => {
    const ts = new Date().toLocaleTimeString('en-GB', { hour12: false })
    setAlerts(prev => [{ id: Date.now(), timestamp: ts, status: 'Active', risk_score: 0, ...alert }, ...prev].slice(0, MAX_ALERTS))
  }, [])

  const addReport = useCallback((report) => {
    const ts = new Date().toLocaleTimeString('en-GB', { hour12: false })
    setReports(prev => [{ id: Date.now(), timestamp: ts, status: 'Pending', ...report }, ...prev])
  }, [])

  const updateZoneStatus = useCallback((zoneId, status, threat = 4) => {
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, status, threat, lastActivity: 'Just now' } : z))
  }, [])

  const addDetection = useCallback((det) => {
    setDetections(prev => [...prev, { id: Date.now(), ...det }])
  }, [])

  // Normalize backend camera shape → internal shape
  const setCamerasData = useCallback((data) => {
    const normalized = data.map(c => ({
      id:       c.camera_id || c.id,
      camera_id: c.camera_id || c.id,
      location: c.location,
      type:     c.type,
      source:   c.source || '',
      status:   c.active ? 'Online' : 'Offline',
    }))
    setCameras(normalized)
  }, [])

  const t = useCallback((en, hi) => lang === 'hi' ? hi : en, [lang])

  return (
    <Ctx.Provider value={{
      user, setUser, token,
      systemStatus, setSystemStatus,
      wsConnected,
      lang, setLang, t,
      mode, setMode,
      threatLevel, setThreatLevel,
      cameras, setCamerasData,
      alerts, addAlert,
      civilianAlerts,
      reports, addReport,
      zones, setZones, updateZoneStatus,
      civilianZones,
      detections, addDetection,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useSurveillance = () => useContext(Ctx)
