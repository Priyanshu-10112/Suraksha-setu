import React, { useEffect } from 'react'
import { useSurveillance } from '../../context/SurveillanceContext'
import { getCameras, getStreamUrl } from '../../services/api'

const THREAT_LABELS = ['', 'Minimal', 'Low', 'Moderate', 'High', 'Critical']
const THREAT_COLORS = ['', '#2d6a4f', '#52b788', '#f4a261', '#e76f51', '#c1121f']
const SEV_COLOR = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#3db87a' }

function ThreatGauge({ level }) {
  const color = THREAT_COLORS[level] || '#52b788'
  const r = 52, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  const dash = ((level - 1) / 4) * circ * 0.75
  const offset = -(circ * 0.125)
  return (
    <div className="threat-gauge-lg">
      <svg width="120" height="80" viewBox="0 0 120 90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2d42" strokeWidth="10"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={offset} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'all 0.6s ease' }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="22" fontWeight="700" fontFamily="JetBrains Mono, monospace">{level}</text>
        <text x={cx} y={cx + 12} textAnchor="middle" fill="#7a8fa8" fontSize="9" fontFamily="Inter, sans-serif">/ 5</text>
      </svg>
      <div className="gauge-label-lg" style={{ color }}>{THREAT_LABELS[level]}</div>
    </div>
  )
}

export default function ThreatDetection() {
  const { threatLevel, alerts, cameras, setCamerasData, t } = useSurveillance()

  useEffect(() => {
    getCameras()
      .then(data => { if (data?.cameras?.length) setCamerasData(data.cameras) })
      .catch(() => {})
  }, [setCamerasData])

  const activeAlerts = alerts.filter(a => a.status === 'Active')
  const primaryCam   = cameras[0]

  // Derive threat level from active alerts
  const computedLevel = activeAlerts.some(a => a.severity === 'Critical') ? 5
    : activeAlerts.some(a => a.severity === 'High') ? 4
    : activeAlerts.some(a => a.severity === 'Medium') ? 3
    : activeAlerts.length > 0 ? 2 : threatLevel

  return (
    <div className="page-inner">
      <div className="threat-layout">
        {/* Primary feed */}
        <div className="threat-feed-col">
          <div className="section-header">
            <span className="section-title">
              {primaryCam
                ? `${t('Primary Feed','प्राथमिक फ़ीड')} — ${primaryCam.location}`
                : t('Primary Feed','प्राथमिक फ़ीड')}
            </span>
            <span className="live-chip"><span className="rec-dot" />LIVE</span>
          </div>
          <div className="threat-feed-wrap">
            <div className="coord-grid" />
            <span className="bracket br-tl" /><span className="bracket br-tr" />
            <span className="bracket br-bl" /><span className="bracket br-br" />
            {primaryCam ? (
              <img
                src={getStreamUrl(primaryCam.camera_id || primaryCam.id)}
                alt="Primary feed"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mut)', fontSize: 12 }}>
                No camera registered
              </div>
            )}
            {primaryCam && (
              <>
                <div className="hud hud-tl"><div>{primaryCam.camera_id || primaryCam.id}</div><div>{primaryCam.location}</div></div>
                <div className="hud hud-br"><div>TYPE: {primaryCam.type?.toUpperCase()}</div></div>
              </>
            )}
          </div>
        </div>

        {/* Gauge + active alerts */}
        <div className="threat-info-col">
          <div className="threat-gauge-card">
            <div className="section-title mb8">{t('Threat Level','खतरा स्तर')}</div>
            <ThreatGauge level={computedLevel} />
          </div>

          <div className="section-header mt12">
            <span className="section-title">{t('Active Threats','सक्रिय खतरे')}</span>
            <span className="count-badge red">{activeAlerts.length}</span>
          </div>

          {activeAlerts.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-mut)', padding: '8px 0' }}>
              {t('No active threats','कोई सक्रिय खतरा नहीं')}
            </div>
          )}

          {activeAlerts.slice(0, 5).map(a => (
            <div key={a.id} className="threat-card">
              <div className="threat-card-top">
                <span className="threat-type">{a.type}</span>
                <span className="threat-sev" style={{ color: SEV_COLOR[a.severity] || '#eab308' }}>{a.severity}</span>
              </div>
              <div className="threat-card-meta">
                <span>{a.camera_id}</span>
                <span>{a.timestamp}</span>
                <span>Risk: {a.risk_score}</span>
              </div>
              <div className="conf-bar-wrap">
                <div className="conf-bar-fill" style={{ width: `${a.risk_score}%`, background: SEV_COLOR[a.severity] || '#eab308' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
