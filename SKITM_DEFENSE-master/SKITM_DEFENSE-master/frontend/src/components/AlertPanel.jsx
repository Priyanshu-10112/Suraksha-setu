import { memo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSurveillance } from '../context/SurveillanceContext'
import { getImageUrl } from '../services/api'

function riskColor(score) {
  if (!score && score !== 0) return '#7a8fa8'
  if (score > 70) return '#ef4444'
  if (score > 40) return '#eab308'
  return '#22c55e'
}

const SEV_CFG = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  High:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  Medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.1)'  },
  Low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
}

// Zone type → display config
const ZONE_TYPE_CFG = {
  restricted: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'INTRUSION' },
  safe:       { color: '#eab308', bg: 'rgba(234,179,8,0.1)',  label: 'UNAUTHORIZED PRESENCE' },
  normal:     { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', label: null }, // normal → no special label
}

function getZoneTypeCfg(zoneType) {
  return ZONE_TYPE_CFG[zoneType] || null
}

// Override severity color based on zone type
function resolveAlertColor(alert) {
  if (alert.alert_type === 'criminal_detected' || alert.type === 'criminal_detected') return '#dc2626'
  const ztCfg = getZoneTypeCfg(alert.zone_type)
  if (ztCfg) return ztCfg.color
  return SEV_CFG[alert.severity]?.color || '#22c55e'
}

const AlertCard = memo(function AlertCard({ alert, isNew, isPulsing }) {
  const cfg    = SEV_CFG[alert.severity] || SEV_CFG.Low
  const rColor = riskColor(alert.risk_score)
  const ztCfg  = getZoneTypeCfg(alert.zone_type)
  const isCriminal = alert.alert_type === 'criminal_detected' || alert.type === 'criminal_detected'
  const borderColor = isCriminal ? '#dc2626' : (ztCfg ? ztCfg.color : cfg.color)

  return (
    <motion.div
      className={`alert-card ${isNew ? 'alert-card-new' : ''} ${isPulsing ? 'alert-card-pulse' : ''} ${isCriminal ? 'criminal-alert-card' : ''}`}
      style={{ borderLeftColor: borderColor, borderLeftWidth: isCriminal ? '5px' : '3px' }}
      initial={{ opacity: 0, x: 16 }}
      animate={isPulsing
        ? { opacity: 1, x: [0, -4, 4, -3, 3, 0], boxShadow: [`0 0 0px ${borderColor}`, `0 0 14px ${borderColor}88`, `0 0 0px ${borderColor}`] }
        : { opacity: 1, x: 0 }
      }
      transition={{ duration: isPulsing ? 0.5 : 0.3, ease: 'easeOut' }}
      layout
    >
      {isCriminal && (
        <div className="criminal-card-badge">
          <span className="criminal-badge-icon">🚨</span>
          <span className="criminal-badge-text">HIGH THREAT</span>
        </div>
      )}
      {(alert.image || alert.image_path) && (
        <img
          src={getImageUrl(alert.image || alert.image_path)}
          alt="detection"
          className="alert-thumb"
          onError={e => { e.target.style.display = 'none' }}
        />
      )}
      <div className="alert-card-body">
        <div className="alert-card-top">
          {isCriminal && alert.suspect_name && (
            <span className="criminal-suspect-badge">
              Suspect: {alert.suspect_name}
            </span>
          )}
          {/* Zone type badge — shown only for restricted/safe */}
          {!isCriminal && ztCfg?.label && (
            <span className="alert-zone-type-badge" style={{ color: ztCfg.color, background: ztCfg.bg }}>
              {ztCfg.label}
            </span>
          )}
          <span className="alert-card-type" style={{ fontWeight: isCriminal ? 700 : 400, color: isCriminal ? '#dc2626' : 'inherit' }}>
            {isCriminal ? '🚨 CRIMINAL DETECTED' : alert.type}
          </span>
          <span className="alert-card-sev" style={{ color: cfg.color, background: cfg.bg }}>{alert.severity}</span>
          <span className={`alert-card-status ${alert.status === 'Active' ? 'status-active' : 'status-resolved'}`}>
            {alert.status}
          </span>
        </div>
        <div className="alert-card-msg" style={{ fontWeight: isCriminal ? 600 : 400 }}>{alert.message}</div>
        <div className="alert-card-meta">
          <span>{alert.camera_id || alert.zone}</span>
          {alert.zone_type && (
            <span style={{ color: ztCfg?.color || 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>
              {alert.zone_type.toUpperCase()}
            </span>
          )}
          <span>{alert.timestamp}</span>
          {alert.risk_score != null && (
            <span className="alert-risk" style={{ color: rColor, fontWeight: isCriminal ? 700 : 400 }}>Risk: {alert.risk_score}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
})

export default function AlertPanel({ maxItems = 10 }) {
  const { alerts, wsConnected, t } = useSurveillance()
  const [zoneFilter, setZoneFilter] = useState('all')
  const [pulsingId, setPulsingId]   = useState(null)
  const prevTopId = useRef(null)

  const filtered = alerts
    .filter(a => zoneFilter === 'all' || a.zone_type === zoneFilter)
    .slice(0, maxItems)

  useEffect(() => {
    const top = filtered[0]
    if (!top || top.id === prevTopId.current) return
    prevTopId.current = top.id
    setPulsingId(top.id)
    const timer = setTimeout(() => setPulsingId(null), 3000)
    return () => clearTimeout(timer)
  }, [filtered[0]?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="alert-panel-rt">
      <div className="ap-rt-header">
        <span className="section-title">{t('Live Alerts', 'लाइव अलर्ट')}</span>
        <div className="ap-rt-meta">
          {/* Zone type filter */}
          <select
            className="ap-zone-filter"
            value={zoneFilter}
            onChange={e => setZoneFilter(e.target.value)}
          >
            <option value="all">All Zones</option>
            <option value="restricted">Restricted</option>
            <option value="safe">Safe</option>
            <option value="normal">Normal</option>
          </select>
          <span className={`ws-badge ${wsConnected ? 'ws-on' : 'ws-off'}`}>
            <span className="ws-dot" />
            {wsConnected ? 'WS LIVE' : 'WS OFF'}
          </span>
          <span className="ap-count">{filtered.length}</span>
        </div>
      </div>
      <div className="ap-rt-list">
        {filtered.length === 0 && (
          <div className="ap-empty">{t('No alerts', 'कोई अलर्ट नहीं')}</div>
        )}
        <AnimatePresence initial={false}>
          {filtered.map((a, i) => (
            <AlertCard key={a.id} alert={a} isNew={i === 0} isPulsing={a.id === pulsingId} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
