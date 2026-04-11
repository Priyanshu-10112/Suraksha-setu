import React, { useState } from 'react'
import { startDetection, stopDetection } from '../services/api'

export default function CameraControls({ camera }) {
  const [active, setActive] = useState(camera.status === 'Online')
  const [busy, setBusy]     = useState(false)
  const [msg, setMsg]       = useState('')

  const handleStart = async () => {
    setBusy(true); setMsg('')
    try {
      const res = await startDetection(camera.id)
      setActive(true)
      setMsg(res.message || 'Detection started.')
    } catch {
      // Demo fallback
      setActive(true)
      setMsg('Demo mode — detection started locally.')
    }
    setBusy(false)
  }

  const handleStop = async () => {
    setBusy(true); setMsg('')
    try {
      const res = await stopDetection(camera.id)
      setActive(false)
      setMsg(res.message || 'Detection stopped.')
    } catch {
      setActive(false)
      setMsg('Demo mode — detection stopped locally.')
    }
    setBusy(false)
  }

  return (
    <div className="cam-ctrl-card">
      <div className="cam-ctrl-header">
        <span className="cam-ctrl-id">{camera.id}</span>
        <span className="cam-ctrl-loc">{camera.location}</span>
        <span className={`cam-ctrl-status ${active ? 'status-ok' : 'status-off'}`}>
          {active ? 'Active' : 'Stopped'}
        </span>
      </div>

      <div className="cam-ctrl-actions">
        <button className="ctrl-btn ctrl-start" onClick={handleStart} disabled={busy || active}>
          ▶ Start
        </button>
        <button className="ctrl-btn ctrl-stop" onClick={handleStop} disabled={busy || !active}>
          ■ Stop
        </button>
      </div>

      <div className="cam-ctrl-meta">
        <span className="ctrl-meta-row"><span>Type</span><span>{camera.type || '—'}</span></span>
        <span className="ctrl-meta-row"><span>Source</span><span>{camera.source || '—'}</span></span>
      </div>

      {msg && <div className="ctrl-msg">{msg}</div>}
    </div>
  )
}
