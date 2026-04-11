import React from 'react'
import { useSurveillance } from '../context/SurveillanceContext'

const THREAT_LABELS = ['', 'Minimal', 'Low', 'Moderate', 'High', 'Critical']
const THREAT_COLORS = ['', '#2d6a4f', '#52b788', '#f4a261', '#e76f51', '#c1121f']

function ThreatGauge({ level }) {
  const pct = ((level - 1) / 4) * 100
  const color = THREAT_COLORS[level]
  const r = 36, cx = 44, cy = 44
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * (circ * 0.75)
  const offset = circ * 0.125

  return (
    <div className="threat-gauge">
      <svg width="88" height="60" viewBox="0 0 88 70">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2a3a52" strokeWidth="7"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={-offset} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={-offset} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease' }} />
        <text x={cx} y={cy - 2} textAnchor="middle" fill={color}
          fontSize="16" fontWeight="700" fontFamily="JetBrains Mono, monospace">{level}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" fill="#8899aa"
          fontSize="7" fontFamily="Inter, sans-serif">/ 5</text>
      </svg>
      <div className="gauge-label" style={{ color }}>{THREAT_LABELS[level]}</div>
    </div>
  )
}

function ZoneMapSVG({ zones }) {
  const cells = [
    { id: 'A1', x: 10,  y: 10,  w: 70, h: 55 },
    { id: 'B2', x: 90,  y: 10,  w: 70, h: 55 },
    { id: 'C3', x: 10,  y: 75,  w: 70, h: 55 },
    { id: 'D4', x: 90,  y: 75,  w: 70, h: 55 },
  ]
  const getColor = (id) => {
    const z = zones.find(z => z.id === id)
    if (!z) return '#2a3a52'
    if (z.status === 'Alert') return 'rgba(193,18,31,0.35)'
    if (z.threat >= 3) return 'rgba(244,162,97,0.2)'
    return 'rgba(45,106,79,0.2)'
  }
  const getBorder = (id) => {
    const z = zones.find(z => z.id === id)
    if (!z) return '#3d4f6a'
    if (z.status === 'Alert') return '#c1121f'
    if (z.threat >= 3) return '#f4a261'
    return '#2d6a4f'
  }

  return (
    <svg viewBox="0 0 170 140" className="zone-map-svg">
      {/* Grid lines */}
      <line x1="80" y1="5" x2="80" y2="135" stroke="#2a3a52" strokeWidth="1" />
      <line x1="5" y1="67" x2="165" y2="67" stroke="#2a3a52" strokeWidth="1" />
      {/* Compass */}
      <text x="155" y="14" fill="#4a6080" fontSize="8" fontFamily="Inter">N</text>
      <line x1="160" y1="16" x2="160" y2="22" stroke="#4a6080" strokeWidth="1" />

      {cells.map(c => (
        <g key={c.id}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="3"
            fill={getColor(c.id)} stroke={getBorder(c.id)} strokeWidth="1.5" />
          <text x={c.x + c.w / 2} y={c.y + c.h / 2 - 4} textAnchor="middle"
            fill={getBorder(c.id)} fontSize="11" fontWeight="700" fontFamily="JetBrains Mono, monospace">{c.id}</text>
          <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 9} textAnchor="middle"
            fill="#8899aa" fontSize="7" fontFamily="Inter, sans-serif">
            {zones.find(z => z.id === c.id)?.status || 'Inactive'}
          </text>
        </g>
      ))}
      <rect x="2" y="2" width="166" height="136" rx="4" fill="none" stroke="#2a3a52" strokeWidth="1" strokeDasharray="4 3" />
    </svg>
  )
}

export default function Sidebar() {
  const { zones, mode, setMode, threatLevel, t, lang } = useSurveillance()
  const alertCount = zones.filter(z => z.status === 'Alert').length
  const activeCams = 4

  return (
    <aside className="sidebar">

      {/* Threat Level */}
      <div className="sb-section">
        <div className="sb-header">
          <span className="sb-icon">◈</span>
          <span>{t('Threat Assessment', 'खतरा आकलन')}</span>
        </div>
        <div className="threat-row">
          <ThreatGauge level={threatLevel} />
          <div className="threat-meta">
            <div className="threat-meta-row">
              <span className="tm-label">{t('Active Alerts','सक्रिय अलर्ट')}</span>
              <span className="tm-val" style={{ color: alertCount > 0 ? '#c1121f' : '#2d6a4f' }}>{alertCount}</span>
            </div>
            <div className="threat-meta-row">
              <span className="tm-label">{t('Cameras','कैमरे')}</span>
              <span className="tm-val" style={{ color: '#2d6a4f' }}>{activeCams}/4</span>
            </div>
            <div className="threat-meta-row">
              <span className="tm-label">{t('Response','प्रतिक्रिया')}</span>
              <span className="tm-val">4.2s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Status */}
      <div className="sb-section">
        <div className="sb-header">
          <span className="sb-icon">⬡</span>
          <span>{t('Zone Status', 'क्षेत्र स्थिति')}</span>
        </div>
        {zones.map(zone => (
          <div key={zone.id} className={`zone-card ${zone.status === 'Alert' ? 'zc-alert' : zone.threat >= 3 ? 'zc-warn' : 'zc-safe'}`}>
            <div className="zc-left">
              <div className="zc-id">{zone.id}</div>
              <div className="zc-name">{lang === 'hi' ? zone.nameHi : zone.name}</div>
              <div className="zc-time">{zone.lastActivity}</div>
            </div>
            <div className="zc-right">
              <div className={`zc-badge ${zone.status === 'Alert' ? 'badge-alert' : 'badge-safe'}`}>
                {zone.status === 'Alert' ? t('ALERT','अलर्ट') : t('SECURE','सुरक्षित')}
              </div>
              <div className="zc-cam">{zone.cam}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sector Map */}
      <div className="sb-section">
        <div className="sb-header">
          <span className="sb-icon">⊞</span>
          <span>{t('Sector Map', 'क्षेत्र मानचित्र')}</span>
        </div>
        <div className="map-container">
          <ZoneMapSVG zones={zones} />
        </div>
      </div>

      {/* Controls */}
      <div className="sb-section">
        <div className="sb-header">
          <span className="sb-icon">⚙</span>
          <span>{t('Control Panel', 'नियंत्रण पैनल')}</span>
        </div>
        <div className="ctrl-row">
          <span className="ctrl-label">{t('Mode','मोड')}</span>
          <div className="mode-tabs">
            <button className={`mtab ${mode === 'Surveillance' ? 'mtab-active' : ''}`}
              onClick={() => setMode('Surveillance')}>
              {t('Surveillance','निगरानी')}
            </button>
            <button className={`mtab mtab-emg ${mode === 'Emergency' ? 'mtab-active-emg' : ''}`}
              onClick={() => setMode('Emergency')}>
              {t('Emergency','आपातकाल')}
            </button>
          </div>
        </div>
        <button className="dispatch-btn">
          <span>⚑</span> {t('Dispatch Response Team', 'प्रतिक्रिया दल भेजें')}
        </button>
        <button className="draw-zone-btn">
          <span>+</span> {t('Draw Zone', 'क्षेत्र बनाएं')}
        </button>
      </div>

    </aside>
  )
}
