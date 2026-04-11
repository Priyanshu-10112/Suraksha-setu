import { useState } from 'react'
import { useSurveillance } from '../../context/SurveillanceContext'

const SEV_CFG = {
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: '🔴' },
  Medium: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', icon: '🟠' },
  Low:    { color: '#eab308', bg: 'rgba(234,179,8,0.1)',  icon: '🟡' },
}

export default function SafetyAlerts() {
  const { civilianAlerts, t } = useSurveillance()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: '', desc: '' })

  const activeHigh = civilianAlerts.filter(a => a.severity === 'High' && a.status === 'Active').length
  const safetyLevel = activeHigh > 0 ? 'orange' : civilianAlerts.filter(a => a.status === 'Active').length > 0 ? 'yellow' : 'green'
  const sc = { green: { label: 'SAFE', color: '#22c55e' }, yellow: { label: 'CAUTION', color: '#eab308' }, orange: { label: 'WARNING', color: '#f97316' } }[safetyLevel]

  return (
    <div className="page-inner">
      <div className="safety-indicator" style={{ borderColor: sc.color, background: `${sc.color}12` }}>
        <span className="safety-dot" style={{ background: sc.color }} />
        <span className="safety-label" style={{ color: sc.color }}>SAFETY LEVEL: {sc.label}</span>
      </div>

      <div className="section-header">
        <span className="section-title">{t('Active Safety Alerts','सक्रिय सुरक्षा अलर्ट')}</span>
        <button className="report-btn" onClick={() => setShowModal(true)}>+ {t('Report Incident','घटना रिपोर्ट करें')}</button>
      </div>

      {civilianAlerts.length === 0 && (
        <div className="ap-empty">{t('No alerts','कोई अलर्ट नहीं')}</div>
      )}
      {civilianAlerts.map(a => {
        const cfg = SEV_CFG[a.severity] || SEV_CFG.Low
        return (
          <div key={a.id} className="civ-alert-card" style={{ borderLeftColor: cfg.color }}>
            <div className="cac-top">
              <span className="cac-icon">{cfg.icon}</span>
              <span className="cac-type">{a.type}</span>
              <span className="cac-sev" style={{ color: cfg.color, background: cfg.bg }}>{a.severity}</span>
              <span className={`cac-status ${a.status === 'Active' ? 'status-active' : 'status-resolved'}`}>{a.status}</span>
            </div>
            <div className="cac-msg">{a.message}</div>
            <div className="cac-meta">Zone {a.zone} · {a.timestamp}</div>
          </div>
        )
      })}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t('Report an Incident','घटना रिपोर्ट करें')}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">{t('Incident Type','घटना प्रकार')}</label>
              <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="">Select type…</option>
                <option>Suspicious Activity</option>
                <option>Abandoned Object</option>
                <option>Crowd Issue</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('Description','विवरण')}</label>
              <textarea className="form-input form-textarea" rows={3}
                value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
            </div>
            <button className="login-btn civilian-btn" onClick={() => setShowModal(false)}>
              {t('Submit Report','रिपोर्ट जमा करें')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
