import { useState, useEffect, useRef, useCallback } from 'react'
import { useSurveillance } from '../../context/SurveillanceContext'
import {
  getCameras, addCamera, deleteCamera, testCamera,
  startDetection, stopDetection, getActiveCameras,
  updateSettings, addZone, getZones, deleteZone,
  getStreamUrl, getImageUrl, getAlerts,
} from '../../services/api'

function riskColor(score) {
  if (score >= 70) return '#ef4444'
  if (score >= 40) return '#eab308'
  return '#3db87a'
}

function Panel({ title, children, action }) {
  return (
    <div className="cm-panel">
      <div className="cm-panel-header">
        <span className="cm-panel-title">{title}</span>
        {action}
      </div>
      <div className="cm-panel-body">{children}</div>
    </div>
  )
}

// ── 1+2: Camera Registration + List ──────────────────────────────────────────
function CameraList({ cameras, activeCams, onRefresh, onSelect, selectedId }) {
  const [form, setForm]         = useState({ camera_id: '', source: '', location: '', type: 'normal' })
  const [adding, setAdding]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [testResults, setTestResults] = useState({})
  const [testing, setTesting]   = useState({})
  const [msg, setMsg]           = useState('')

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.camera_id || !form.source || !form.location) { setMsg('All fields required.'); return }
    setAdding(true); setMsg('')
    try {
      await addCamera(form)
      setMsg('Camera added.')
      setForm({ camera_id: '', source: '', location: '', type: 'normal' })
      setShowForm(false)
      onRefresh()
    } catch (err) {
      setMsg(`Failed: ${err.message}`)
    }
    setAdding(false)
  }

  const handleDelete = async (id) => {
    if (!confirm(`Delete ${id}?`)) return
    try { await deleteCamera(id); onRefresh() } catch (err) { setMsg(`Delete failed: ${err.message}`) }
  }

  // Test uses camera source, not camera_id
  const handleTest = async (cam) => {
    const id = cam.camera_id || cam.id
    setTesting(t => ({ ...t, [id]: true }))
    try {
      const res = await testCamera(cam.source || id)
      setTestResults(r => ({ ...r, [id]: res.status === 'success' ? 'Connected' : 'Failed' }))
    } catch {
      setTestResults(r => ({ ...r, [id]: 'Failed' }))
    }
    setTesting(t => ({ ...t, [id]: false }))
  }

  return (
    <Panel title="Camera Management" action={
      <button className="cm-btn cm-btn-primary" onClick={() => setShowForm(s => !s)}>
        {showForm ? '✕ Cancel' : '+ Add Camera'}
      </button>
    }>
      {showForm && (
        <form className="cm-form" onSubmit={handleAdd}>
          <div className="cm-form-row">
            <div className="form-group">
              <label className="form-label">Camera ID</label>
              <input className="form-input" placeholder="cam1" value={form.camera_id}
                onChange={e => setForm(f => ({ ...f, camera_id: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Source</label>
              <input className="form-input" placeholder="0 or http://192.168.x.x:8080/videofeed" value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" placeholder="Main Gate" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="normal">Normal</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>
          {msg && <div className="cm-msg">{msg}</div>}
          <button className="cm-btn cm-btn-primary" type="submit" disabled={adding}>
            {adding ? 'Adding…' : 'Register Camera'}
          </button>
        </form>
      )}

      <div className="cm-table-wrap">
        <table className="cm-table">
          <thead>
            <tr><th>ID</th><th>Location</th><th>Source</th><th>Type</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {cameras.length === 0 && (
              <tr><td colSpan={6} className="cm-empty">No cameras registered</td></tr>
            )}
            {cameras.map(cam => {
              const id = cam.camera_id || cam.id
              const isActive = activeCams.includes(id)
              const testRes  = testResults[id]
              return (
                <tr key={id}
                  className={selectedId === id ? 'cm-row-selected' : ''}
                  onClick={() => onSelect(id)}>
                  <td className="cm-mono">{id}</td>
                  <td>{cam.location}</td>
                  <td className="cm-mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>{cam.source}</td>
                  <td><span className={`cm-type-badge ${cam.type === 'restricted' ? 'badge-restricted' : 'badge-normal'}`}>{cam.type}</span></td>
                  <td>
                    <span className={`cm-status-dot ${isActive ? 'dot-active' : 'dot-inactive'}`} />
                    {isActive ? 'Running' : 'Stopped'}
                  </td>
                  <td className="cm-actions" onClick={e => e.stopPropagation()}>
                    <button className="cm-btn cm-btn-sm" onClick={() => handleTest(cam)} disabled={testing[id]}>
                      {testing[id] ? '…' : 'Test'}
                    </button>
                    {testRes && (
                      <span className={`cm-test-result ${testRes === 'Connected' ? 'test-ok' : 'test-fail'}`}>
                        {testRes}
                      </span>
                    )}
                    <button className="cm-btn cm-btn-danger" onClick={() => handleDelete(id)}>Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

// ── 4: Live Feed Viewer ───────────────────────────────────────────────────────
function LiveFeedViewer({ cameras, selectedId, onSelect }) {
  const streamUrl = selectedId ? getStreamUrl(selectedId) : null

  if (cameras.length === 0) {
    return (
      <Panel title="Live Feed">
        <div className="cm-empty" style={{ padding: 40 }}>
          No cameras registered. Go to the <strong>Cameras</strong> tab to add one.
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Live Feed">
      <div className="cm-feed-layout">
        {/* Camera switcher */}
        <div className="cm-cam-switcher">
          {cameras.map(cam => {
            const id = cam.camera_id || cam.id
            return (
              <button key={id}
                className={`cm-cam-tab ${selectedId === id ? 'cam-tab-active' : ''}`}
                onClick={() => onSelect(id)}>
                {id}
              </button>
            )
          })}
        </div>

        {/* Feed — only render img when a camera is selected */}
        <div className="cm-feed-box">
          {selectedId && streamUrl ? (
            <img
              key={selectedId}
              src={streamUrl}
              alt={`Feed ${selectedId}`}
              className="cm-feed-img"
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="cm-feed-placeholder">Select a camera above to view its feed</div>
          )}
          {selectedId && <div className="cm-feed-label">{selectedId}</div>}
        </div>
      </div>
    </Panel>
  )
}

// ── 5: Zone Configuration ─────────────────────────────────────────────────────
function ZoneConfig({ selectedId }) {
  const [zones, setZones]     = useState([])
  const [rect, setRect]       = useState(null)
  const [drawing, setDrawing] = useState(false)
  const [start, setStart]     = useState(null)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [zoneType, setZoneType] = useState('normal')
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!selectedId) return
    getZones(selectedId).then(d => setZones(d?.zones || [])).catch(() => {})
  }, [selectedId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // Draw saved zones in blue
    zones.forEach(z => {
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 2])
      ctx.strokeRect(z.x1, z.y1, z.x2 - z.x1, z.y2 - z.y1)
      ctx.fillStyle = 'rgba(59,130,246,0.06)'
      ctx.fillRect(z.x1, z.y1, z.x2 - z.x1, z.y2 - z.y1)
    })
    if (!rect) return
    const { x1, y1, x2, y2 } = rect
    ctx.strokeStyle = '#e8722a'; ctx.lineWidth = 2; ctx.setLineDash([6, 3])
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
    ctx.fillStyle = 'rgba(232,114,42,0.1)'; ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
  }, [rect, zones])

  const getPos = (e) => {
    const b = canvasRef.current.getBoundingClientRect()
    const sx = canvasRef.current.width / b.width
    const sy = canvasRef.current.height / b.height
    return { x: Math.round((e.clientX - b.left) * sx), y: Math.round((e.clientY - b.top) * sy) }
  }

  const handleSave = async () => {
    if (!rect || !selectedId) return
    setSaving(true); setMsg('')
    try {
      const res = await addZone({ camera_id: selectedId, zone_type: zoneType, ...rect })
      setZones(z => [...z, res.zone || { id: Date.now(), zone_type: zoneType, ...rect }])
      setRect(null); setMsg('Zone saved.')
    } catch {
      setZones(z => [...z, { id: Date.now(), zone_type: zoneType, ...rect }])
      setRect(null); setMsg('Saved locally (backend offline).')
    }
    setSaving(false)
  }

  const handleDeleteZone = async (zoneId) => {
    try { await deleteZone(zoneId) } catch {}
    setZones(z => z.filter(zn => zn.id !== zoneId))
  }

  if (!selectedId) return <Panel title="Zone Configuration"><div className="cm-empty">Select a camera first</div></Panel>

  return (
    <Panel title={`Zone Configuration — ${selectedId}`}>
      <p className="cm-hint">Draw a rectangle on the live frame to define a detection zone.</p>
      
      {/* Zone Type Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)' }}>Zone Type:</span>
        <button 
          className={`cm-btn ${zoneType === 'normal' ? 'cm-btn-primary' : ''}`}
          style={{ fontSize: '10px', padding: '4px 10px' }}
          onClick={() => setZoneType('normal')}
        >
          Normal
        </button>
        <button 
          className={`cm-btn ${zoneType === 'safe' ? 'cm-btn-primary' : ''}`}
          style={{ fontSize: '10px', padding: '4px 10px' }}
          onClick={() => setZoneType('safe')}
        >
          Safe
        </button>
        <button 
          className={`cm-btn ${zoneType === 'restricted' ? 'cm-btn-primary' : ''}`}
          style={{ fontSize: '10px', padding: '4px 10px' }}
          onClick={() => setZoneType('restricted')}
        >
          Restricted
        </button>
        <span style={{ 
          fontSize: '9px', 
          fontWeight: 700, 
          padding: '3px 8px', 
          borderRadius: '3px',
          background: zoneType === 'restricted' ? 'rgba(239,68,68,0.15)' : zoneType === 'safe' ? 'rgba(34,197,94,0.15)' : 'rgba(0,212,255,0.15)',
          color: zoneType === 'restricted' ? '#ef4444' : zoneType === 'safe' ? '#22c55e' : '#00d4ff',
          letterSpacing: '1px'
        }}>
          {zoneType.toUpperCase()}
        </span>
      </div>

      <div className="cm-zone-layout">
        <div className="cm-canvas-wrap">
          <img src={getStreamUrl(selectedId)} alt="frame" className="cm-zone-frame"
            onError={e => { e.target.style.display = 'none' }} />
          <canvas ref={canvasRef} className="cm-zone-canvas" width={640} height={360}
            onMouseDown={e => { setDrawing(true); const p = getPos(e); setStart(p); setRect(null) }}
            onMouseMove={e => {
              if (!drawing || !start) return
              const p = getPos(e)
              setRect({ x1: Math.min(start.x, p.x), y1: Math.min(start.y, p.y), x2: Math.max(start.x, p.x), y2: Math.max(start.y, p.y) })
            }}
            onMouseUp={() => setDrawing(false)} />
        </div>
        <div className="cm-zone-sidebar">
          {rect && <div className="cm-zone-coords"><div>({rect.x1}, {rect.y1})</div><div>→ ({rect.x2}, {rect.y2})</div></div>}
          <button className="cm-btn cm-btn-primary" onClick={handleSave} disabled={saving || !rect}>
            {saving ? 'Saving…' : '⊕ Save Zone'}
          </button>
          {msg && <div className="cm-msg">{msg}</div>}
          <div className="cm-zone-list-label">Saved Zones ({zones.length})</div>
          {zones.length === 0 && <div className="cm-empty-sm">None</div>}
          {zones.map(z => (
            <div key={z.id} className="cm-zone-item">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                <span className="cm-mono">#{z.id} ({z.x1},{z.y1})→({z.x2},{z.y2})</span>
                {z.zone_type && (
                  <span style={{
                    fontSize: '8px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '2px',
                    background: z.zone_type === 'restricted' ? 'rgba(239,68,68,0.15)' : z.zone_type === 'safe' ? 'rgba(34,197,94,0.15)' : 'rgba(0,212,255,0.15)',
                    color: z.zone_type === 'restricted' ? '#ef4444' : z.zone_type === 'safe' ? '#22c55e' : '#00d4ff',
                    letterSpacing: '1px',
                    width: 'fit-content'
                  }}>
                    {z.zone_type.toUpperCase()}
                  </span>
                )}
              </div>
              <button className="cm-btn cm-btn-danger cm-btn-xs" onClick={() => handleDeleteZone(z.id)}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

// ── 6+7: Detection Control + Settings ────────────────────────────────────────
function DetectionControl({ cameras, activeCams, onRefresh }) {
  const [confidence, setConfidence]   = useState(0.5)
  const [cooldown, setCooldown]       = useState(3)
  const [busy, setBusy]               = useState({})
  const [msgs, setMsgs]               = useState({})

  const toggle = async (camId, isActive) => {
    setBusy(b => ({ ...b, [camId]: true }))
    try {
      const res = isActive ? await stopDetection(camId) : await startDetection(camId)
      setMsgs(m => ({ ...m, [camId]: res.message || (isActive ? 'Stopped.' : 'Started.') }))
      onRefresh()
    } catch (err) {
      setMsgs(m => ({ ...m, [camId]: err.message }))
    }
    setBusy(b => ({ ...b, [camId]: false }))
    setTimeout(() => setMsgs(m => ({ ...m, [camId]: '' })), 3000)
  }

  const saveSettings = async (camId) => {
    try {
      await updateSettings({ camera_id: camId, confidence, cooldown })
      setMsgs(m => ({ ...m, [camId]: 'Settings saved.' }))
    } catch {
      setMsgs(m => ({ ...m, [camId]: 'Applied locally.' }))
    }
    setTimeout(() => setMsgs(m => ({ ...m, [camId]: '' })), 3000)
  }

  return (
    <Panel title="Detection Control & Settings">
      <div className="cm-ctrl-grid">
        {cameras.map(cam => {
          const id = cam.camera_id || cam.id
          const isActive = activeCams.includes(id)
          return (
            <div key={id} className="cm-ctrl-card">
              <div className="cm-ctrl-top">
                <span className="cm-mono cm-ctrl-id">{id}</span>
                <span className="cm-ctrl-loc">{cam.location}</span>
                <span className={`cm-status-dot ${isActive ? 'dot-active' : 'dot-inactive'}`} />
              </div>
              <div className="cm-ctrl-btns">
                <button className="cm-btn cm-btn-start" onClick={() => toggle(id, false)} disabled={busy[id] || isActive}>▶ Start</button>
                <button className="cm-btn cm-btn-stop"  onClick={() => toggle(id, true)}  disabled={busy[id] || !isActive}>■ Stop</button>
              </div>
              <div className="cm-slider-row">
                <label className="cm-slider-label">Confidence: {Math.round(confidence * 100)}%</label>
                <input type="range" min="0.1" max="1" step="0.05" value={confidence}
                  onChange={e => setConfidence(+e.target.value)} className="cm-slider" />
              </div>
              <div className="cm-slider-row">
                <label className="cm-slider-label">Cooldown: {cooldown}s</label>
                <input type="range" min="1" max="30" step="1" value={cooldown}
                  onChange={e => setCooldown(+e.target.value)} className="cm-slider" />
              </div>
              <button className="cm-btn cm-btn-sm" onClick={() => saveSettings(id)}>Apply Settings</button>
              {msgs[id] && <div className="cm-msg cm-msg-ok">{msgs[id]}</div>}
            </div>
          )
        })}
        {cameras.length === 0 && <div className="cm-empty">No cameras registered</div>}
      </div>
    </Panel>
  )
}

// ── 8+9: Alert Dashboard ──────────────────────────────────────────────────────
function AlertDashboard() {
  const { alerts: wsAlerts } = useSurveillance()
  const [histAlerts, setHistAlerts] = useState([])

  useEffect(() => {
    getAlerts(20).then(d => {
      if (d?.alerts) {
        setHistAlerts(d.alerts.map(a => ({
          ...a,
          risk_score: a.risk,
          zone_type:  a.zone_type  || null,
          alert_type: a.alert_type || null,
          timestamp_fmt: a.timestamp
            ? new Date(a.timestamp).toLocaleTimeString('en-GB', { hour12: false })
            : '—',
        })))
      }
    }).catch(() => {})
  }, [])

  const all = [...wsAlerts, ...histAlerts.filter(h => !wsAlerts.find(w => w.id === h.id))]

  return (
    <Panel title={`Alert Dashboard (${all.length})`}>
      <div className="cm-alert-grid">
        {all.length === 0 && <div className="cm-empty">No alerts yet — start detection to receive alerts</div>}
        {all.map(a => {
          const risk  = a.risk_score ?? a.risk ?? 0
          const color = riskColor(risk)
          const imgFile = a.image || a.image_path
          return (
            <div key={a.id} className="cm-alert-card" style={{ borderLeftColor: color }}>
              {imgFile && (
                <img src={getImageUrl(imgFile)} alt="alert" className="cm-alert-img"
                  onError={e => { e.target.style.display = 'none' }} />
              )}
              <div className="cm-alert-body">
                <div className="cm-alert-top">
                  <span className="cm-mono">{a.camera_id}</span>
                  <span className="cm-risk" style={{ color }}>Risk: {risk}</span>
                </div>
                {a.zone_type && (
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color, marginBottom: 3 }}>
                    {a.zone_type.toUpperCase()} · {a.alert_type?.toUpperCase() || 'ALERT'}
                  </div>
                )}
                <div className="cm-alert-loc">{a.location || a.zone || '—'}</div>
                <div className="cm-alert-msg">{a.message}</div>
                <div className="cm-alert-ts">{a.timestamp_fmt || a.timestamp}</div>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CameraManagement() {
  const { setCamerasData } = useSurveillance()
  const [cameras, setCameras]       = useState([])
  const [activeCams, setActiveCams] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [tab, setTab]               = useState('cameras')

  const refresh = useCallback(async () => {
    try {
      const [camData, activeData] = await Promise.all([getCameras(), getActiveCameras()])
      const list = camData?.cameras || []
      setCameras(list)
      setCamerasData(list)
      setActiveCams(activeData?.active_cameras || [])
      // Auto-select first camera, or clear if none
      if (list.length > 0) {
        setSelectedId(prev => prev || (list[0].camera_id || list[0].id))
      } else {
        setSelectedId(null)
      }
    } catch { /* backend offline — cameras stays empty */ }
  }, [setCamerasData])

  useEffect(() => { refresh() }, []) // eslint-disable-line

  const TABS = [
    { id: 'cameras', label: '📷 Cameras'  },
    { id: 'feed',    label: '▶ Live Feed' },
    { id: 'zones',   label: '⊞ Zones'    },
    { id: 'control', label: '⚙ Control'  },
    { id: 'alerts',  label: '⚑ Alerts'   },
  ]

  return (
    <div className="page-inner">
      <div className="cm-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`cm-tab ${tab === t.id ? 'cm-tab-active' : ''}`}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === 'cameras' && <CameraList cameras={cameras} activeCams={activeCams} onRefresh={refresh} onSelect={setSelectedId} selectedId={selectedId} />}
      {tab === 'feed'    && <LiveFeedViewer cameras={cameras} selectedId={selectedId} onSelect={setSelectedId} />}
      {tab === 'zones'   && <ZoneConfig selectedId={selectedId} />}
      {tab === 'control' && <DetectionControl cameras={cameras} activeCams={activeCams} onRefresh={refresh} />}
      {tab === 'alerts'  && <AlertDashboard />}
    </div>
  )
}
