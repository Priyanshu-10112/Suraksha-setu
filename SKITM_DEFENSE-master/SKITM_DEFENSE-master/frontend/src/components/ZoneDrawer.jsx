import { useState, useRef, useEffect } from 'react'
import { getStreamUrl, addZone } from '../services/api'

const ZONE_TYPES = [
  { value: 'restricted', label: 'Restricted', color: '#ef4444' },
  { value: 'safe',       label: 'Safe',       color: '#22c55e' },
  { value: 'normal',     label: 'Normal',     color: '#00d4ff' },
]

function getZoneColor(type) {
  return ZONE_TYPES.find(z => z.value === type)?.color || '#00d4ff'
}

export default function ZoneDrawer({ cameraId, onSaved, onCancel }) {
  const [zoneType, setZoneType] = useState('normal')
  const [rect, setRect]         = useState(null)
  const [drawing, setDrawing]   = useState(false)
  const [start, setStart]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const canvasRef = useRef(null)

  const color = getZoneColor(zoneType)

  // Redraw canvas whenever rect or zone type changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!rect) return
    const { x1, y1, x2, y2 } = rect
    ctx.strokeStyle = color
    ctx.lineWidth   = 2
    ctx.setLineDash([6, 3])
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
    ctx.fillStyle = `${color}18`
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
    // Label tag
    ctx.setLineDash([])
    ctx.fillStyle = color
    ctx.fillRect(x1, y1 - 20, 110, 20)
    ctx.fillStyle = '#0b1220'
    ctx.font = 'bold 11px JetBrains Mono, monospace'
    ctx.fillText(`${zoneType.toUpperCase()} ZONE`, x1 + 5, y1 - 5)
  }, [rect, color, zoneType])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const b = canvas.getBoundingClientRect()
    return {
      x: Math.round((e.clientX - b.left) * (canvas.width  / b.width)),
      y: Math.round((e.clientY - b.top)  * (canvas.height / b.height)),
    }
  }

  const handleSave = async () => {
    if (!rect) { setError('Draw a rectangle first.'); return }
    setSaving(true); setError('')
    try {
      const res = await addZone({ camera_id: cameraId, zone_type: zoneType, ...rect })
      onSaved?.(res.zone || { camera_id: cameraId, zone_type: zoneType, id: Date.now(), ...rect })
    } catch {
      onSaved?.({ camera_id: cameraId, zone_type: zoneType, id: Date.now(), ...rect })
    }
    setSaving(false)
  }

  return (
    <div className="zone-drawer">
      <div className="zd-header">
        <span className="section-title">Draw Zone — {cameraId}</span>
        <button className="modal-close" onClick={onCancel}>✕</button>
      </div>

      {/* Zone type selector */}
      <div className="zd-type-row">
        <span className="zd-type-label">Zone Type</span>
        <div className="zd-type-options">
          {ZONE_TYPES.map(zt => (
            <button
              key={zt.value}
              className={`zd-type-btn ${zoneType === zt.value ? 'zdt-active' : ''}`}
              style={{
                borderColor: zoneType === zt.value ? zt.color : 'var(--border)',
                color:       zoneType === zt.value ? zt.color : 'var(--text-dim)',
                background:  zoneType === zt.value ? `${zt.color}15` : 'transparent',
              }}
              onClick={() => setZoneType(zt.value)}
            >
              <span className="zdt-dot" style={{ background: zt.color }} />
              {zt.label}
            </button>
          ))}
        </div>
        {/* Color preview */}
        <div className="zdt-preview" style={{ background: `${color}20`, borderColor: color }}>
          <span style={{ color }}>●</span>
          <span style={{ color, fontSize: 10 }}>{zoneType.toUpperCase()}</span>
        </div>
      </div>

      <p className="cm-hint">Draw a rectangle on the live feed to define the detection zone.</p>

      <div className="zd-canvas-wrap">
        <img
          src={getStreamUrl(cameraId)}
          alt="Live feed"
          className="zd-frame"
          onError={e => { e.target.style.opacity = '0.2' }}
        />
        <canvas
          ref={canvasRef}
          className="zd-canvas"
          width={640} height={360}
          onMouseDown={e => { setDrawing(true); const p = getPos(e); setStart(p); setRect(null) }}
          onMouseMove={e => {
            if (!drawing || !start) return
            const p = getPos(e)
            setRect({
              x1: Math.min(start.x, p.x), y1: Math.min(start.y, p.y),
              x2: Math.max(start.x, p.x), y2: Math.max(start.y, p.y),
            })
          }}
          onMouseUp={() => setDrawing(false)}
          onMouseLeave={() => setDrawing(false)}
        />
      </div>

      <div className="zd-footer">
        {rect && (
          <div className="zd-coords" style={{ color }}>
            ({rect.x1}, {rect.y1}) → ({rect.x2}, {rect.y2})
            &nbsp;·&nbsp; {rect.x2 - rect.x1}×{rect.y2 - rect.y1}px
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        <button
          className="login-btn defense-btn"
          onClick={handleSave}
          disabled={saving || !rect}
          style={{ marginTop: 0 }}
        >
          {saving ? 'Saving…' : `⊕ Save ${zoneType.charAt(0).toUpperCase() + zoneType.slice(1)} Zone`}
        </button>
      </div>
    </div>
  )
}
