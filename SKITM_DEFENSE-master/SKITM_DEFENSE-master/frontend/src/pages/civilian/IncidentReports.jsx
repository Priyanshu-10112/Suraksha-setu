import { useState } from 'react'
import { useSurveillance } from '../../context/SurveillanceContext'

const STATUS_CFG = {
  Pending:      { color: '#eab308', bg: 'rgba(234,179,8,0.1)'  },
  'In Progress':{ color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  Resolved:     { color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
}

const SAFETY_TIPS = [
  'Report suspicious unattended objects immediately to security.',
  'In case of emergency, proceed to the nearest marked exit.',
  'Keep your belongings with you at all times.',
  'Contact authorities: 100 (Police) · 101 (Fire) · 108 (Ambulance)',
]

export default function IncidentReports() {
  const { reports, addReport, t } = useSurveillance()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: '', description: '', reporter: 'Anonymous' })

  const handleSubmit = () => {
    if (!form.type || !form.description) return
    addReport(form)
    setForm({ type: '', description: '', reporter: 'Anonymous' })
    setShowModal(false)
  }

  return (
    <div className="page-inner">
      <div className="two-col-layout">
        <div>
          <div className="section-header">
            <span className="section-title">{t('Incident Reports','घटना रिपोर्ट')}</span>
            <button className="report-btn" onClick={() => setShowModal(true)}>+ {t('New Report','नई रिपोर्ट')}</button>
          </div>
          {reports.length === 0 && <div className="ap-empty">{t('No reports submitted','कोई रिपोर्ट नहीं')}</div>}
          {reports.map(r => {
            const cfg = STATUS_CFG[r.status] || STATUS_CFG.Pending
            return (
              <div key={r.id} className="report-card">
                <div className="rc-top">
                  <span className="rc-type">{r.type}</span>
                  <span className="rc-status" style={{ color: cfg.color, background: cfg.bg }}>{r.status}</span>
                </div>
                <div className="rc-desc">{r.description}</div>
                <div className="rc-meta">
                  <span>{r.reporter}</span>
                  <span>{r.timestamp}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div>
          <div className="section-header">
            <span className="section-title">{t('Safety Tips','सुरक्षा सुझाव')}</span>
          </div>
          <div className="tips-card">
            {SAFETY_TIPS.map((tip, i) => (
              <div key={i} className="tip-item">
                <span className="tip-num">{i + 1}</span>
                <span className="tip-text">{tip}</span>
              </div>
            ))}
          </div>
          <button className="contact-btn">📞 {t('Contact Authorities','अधिकारियों से संपर्क करें')}</button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t('Submit Incident Report','घटना रिपोर्ट जमा करें')}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">{t('Incident Type','घटना प्रकार')}</label>
              <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="">Select…</option>
                <option>Suspicious Activity</option>
                <option>Abandoned Object</option>
                <option>Crowd Issue</option>
                <option>Medical Emergency</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('Description','विवरण')}</label>
              <textarea className="form-input form-textarea" rows={3}
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <button className="login-btn civilian-btn" onClick={handleSubmit}>{t('Submit','जमा करें')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
