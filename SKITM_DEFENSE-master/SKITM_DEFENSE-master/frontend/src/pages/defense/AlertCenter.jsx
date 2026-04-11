import { useState, useEffect } from 'react'
import { useSurveillance } from '../../context/SurveillanceContext'
import { getAlerts } from '../../services/api'

const SEV_CFG = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  High:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  Medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.1)'  },
  Low:      { color: '#3db87a', bg: 'rgba(61,184,122,0.1)' },
}

function exportCSV(rows) {
  const header = 'Time,Zone,Camera,Type,Message,Severity,Status,Risk\n'
  const body = rows.map(a =>
    [a.timestamp, a.zone, a.camera_id || '', a.type, `"${a.message}"`, a.severity, a.status, a.risk_score ?? ''].join(',')
  ).join('\n')
  const blob = new Blob([header + body], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `alerts_${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function riskToSeverity(risk) {
  if (!risk && risk !== 0) return 'Low'
  if (risk >= 70) return 'Critical'
  if (risk >= 40) return 'Medium'
  return 'Low'
}

export default function AlertCenter() {
  const { alerts: ctxAlerts, t } = useSurveillance()
  const [sevFilter, setSevFilter]       = useState('All')
  const [zoneFilter, setZoneFilter]     = useState('All')
  const [zoneTypeFilter, setZoneTypeFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [page, setPage]             = useState(1)
  const [historyAlerts, setHistoryAlerts] = useState([])
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const PER_PAGE = 20

  // Merge context (real-time) + history (paginated from API)
  const allAlerts = [...ctxAlerts, ...historyAlerts.filter(h => !ctxAlerts.find(c => c.id === h.id))]

  useEffect(() => {
    getAlerts(PER_PAGE * page)
      .then(data => {
        if (data?.alerts) {
          const normalized = data.alerts.map(a => ({
            ...a,
            zone:       a.location   || '—',
            risk_score: a.risk       ?? 0,
            severity:   riskToSeverity(a.risk),
            status:     a.status || 'Active',
            type:       a.alert_type || 'Intrusion',
            zone_type:  a.zone_type  || null,
            alert_type: a.alert_type || null,
            timestamp:  a.timestamp ? new Date(a.timestamp).toLocaleTimeString('en-GB', { hour12: false }) : '—',
          }))
          setHistoryAlerts(normalized)
        }
      })
      .catch(() => {/* use context data */})
  }, [page, sevFilter])

  const zones = ['All', ...new Set(allAlerts.map(a => a.zone).filter(Boolean))]
  const sevs  = ['All', 'Critical', 'High', 'Medium', 'Low']

  const filtered = allAlerts.filter(a =>
    (sevFilter      === 'All' || a.severity  === sevFilter) &&
    (zoneFilter     === 'All' || a.zone      === zoneFilter) &&
    (zoneTypeFilter === 'All' || a.zone_type === zoneTypeFilter) &&
    (priorityFilter === 'All' || a.priority  === priorityFilter)
  )

  // Get action suggestions based on zone_type and risk_level
  const getActionSuggestions = (alert) => {
    const suggestions = []
    const risk = alert.risk_score ?? 0
    const zoneType = alert.zone_type

    if (zoneType === 'restricted' && risk >= 70) {
      suggestions.push('Send Patrol', 'High Alert', 'Notify Command')
    } else if (zoneType === 'restricted') {
      suggestions.push('Send Patrol', 'Monitor Closely')
    } else if (zoneType === 'safe') {
      suggestions.push('Monitor Only', 'Log Incident')
    } else if (risk >= 70) {
      suggestions.push('High Alert', 'Send Response Team')
    } else if (risk >= 40) {
      suggestions.push('Standard Response', 'Monitor')
    } else {
      suggestions.push('Monitor Only', 'Log Incident')
    }

    return suggestions
  }

  // Handle View button
  const handleView = (alert) => {
    setSelectedAlert(alert)
    setShowModal(true)
  }

  // Handle Acknowledge button
  const handleAck = (alertId) => {
    setHistoryAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, status: 'Acknowledged' } : a
    ))
  }

  // Handle Resolve button
  const handleResolve = (alertId) => {
    setHistoryAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, status: 'Resolved' } : a
    ))
  }

  // Handle Delete button
  const handleDelete = (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      setHistoryAlerts(prev => prev.filter(a => a.id !== alertId))
    }
  }

  // Separate alerts by status
  const activeAlerts = filtered.filter(a => a.status === 'Active')
  const acknowledgedAlerts = filtered.filter(a => a.status === 'Acknowledged')
  const resolvedAlerts = filtered.filter(a => a.status === 'Resolved')

  return (
    <div className="page-inner">
      {/* Summary */}
      <div className="stats-row">
        {['Critical','High','Medium','Low'].map(s => {
          const count = allAlerts.filter(a => a.severity === s).length
          const cfg = SEV_CFG[s]
          return (
            <div key={s} className="stat-card" style={{ borderLeftColor: cfg.color }}>
              <div className="stat-val" style={{ color: cfg.color }}>{count}</div>
              <div className="stat-label">{s}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">{t('Priority','प्राथमिकता')}</label>
          <select className="filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            {['All','HIGH','NORMAL'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">{t('Severity','गंभीरता')}</label>
          <select className="filter-select" value={sevFilter} onChange={e => { setSevFilter(e.target.value); setPage(1) }}>
            {sevs.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">{t('Zone Type','क्षेत्र प्रकार')}</label>
          <select className="filter-select" value={zoneTypeFilter} onChange={e => setZoneTypeFilter(e.target.value)}>
            {['All','restricted','safe','normal'].map(z => <option key={z}>{z}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">{t('Zone','क्षेत्र')}</label>
          <select className="filter-select" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}>
            {zones.map(z => <option key={z}>{z}</option>)}
          </select>
        </div>
        <div className="filter-spacer" />
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="export-btn-lg" onClick={() => exportCSV(filtered)}>⬇ CSV</button>
          <button className="export-btn-lg" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
          <span style={{ padding: '7px 8px', fontSize: 11, color: 'var(--text-dim)' }}>p{page}</span>
          <button className="export-btn-lg" onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      </div>

      {/* Active Alerts Section */}
      {activeAlerts.length > 0 && (
        <>
          <div className="section-header">
            <div className="section-title">🔴 Active Alerts</div>
            <div className="count-badge red">{activeAlerts.length}</div>
          </div>
          <div className="alert-table-wrap">
            <div className="alert-table-head">
              <span>{t('Time','समय')}</span>
              <span>{t('Camera','कैमरा')}</span>
              <span>{t('Zone Type','क्षेत्र प्रकार')}</span>
              <span>{t('Alert Type','अलर्ट प्रकार')}</span>
              <span>{t('Message','संदेश')}</span>
              <span>{t('Severity','गंभीरता')}</span>
              <span>{t('Risk','जोखिम')}</span>
              <span>{t('Action','कार्रवाई')}</span>
            </div>
            <div className="alert-table-body">
              {activeAlerts.map((a, i) => {
                const cfg = SEV_CFG[a.severity] || SEV_CFG.Low
                const ztColor = a.zone_type === 'restricted' ? '#ef4444'
                  : a.zone_type === 'safe' ? '#eab308' : '#00d4ff'
                const isCriminal = a.alert_type === 'criminal_detected' || a.type === 'criminal_detected'
                return (
                  <div 
                    key={a.id} 
                    className={`alert-table-row ${i === 0 ? 'row-new' : ''} ${isCriminal ? 'criminal-alert-row' : ''}`} 
                    style={{ borderLeftColor: isCriminal ? '#dc2626' : cfg.color, borderLeftWidth: isCriminal ? '5px' : '3px' }}
                  >
                    <span className="col-mono">{a.timestamp}</span>
                    <span className="col-mono col-bold">{a.camera_id || '—'}</span>
                    <span className="col-mono" style={{ color: ztColor, fontWeight: 700, fontSize: 9, letterSpacing: 1 }}>
                      {a.zone_type?.toUpperCase() || '—'}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: isCriminal ? 700 : 400, color: isCriminal ? '#dc2626' : 'inherit' }}>
                      {isCriminal ? '🚨 CRIMINAL' : (a.alert_type || a.type || '—')}
                    </span>
                    <span className="col-msg" style={{ fontWeight: isCriminal ? 700 : 400 }}>
                      {isCriminal && a.suspect_name && <span style={{ color: '#dc2626' }}>Suspect: {a.suspect_name} | </span>}
                      {a.message}
                    </span>
                    <span className="col-sev" style={{ color: cfg.color, background: cfg.bg }}>{a.severity}</span>
                    <span className="col-mono" style={{ color: a.risk_score > 70 ? '#ef4444' : a.risk_score > 40 ? '#eab308' : '#22c55e', fontWeight: isCriminal ? 700 : 400 }}>
                      {a.risk_score ?? '—'}
                    </span>
                    <span className="col-actions">
                      {isCriminal && <span className="priority-badge">HIGH</span>}
                      <button className="tbl-btn" onClick={() => handleView(a)}>View</button>
                      <button className="tbl-btn tbl-btn-ack" onClick={() => handleAck(a.id)}>Ack</button>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Acknowledged Alerts Section */}
      {acknowledgedAlerts.length > 0 && (
        <>
          <div className="section-header">
            <div className="section-title">⚠️ Acknowledged (Admin ne dekh liye)</div>
            <div className="count-badge" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' }}>{acknowledgedAlerts.length}</div>
          </div>
          <div className="alert-table-wrap">
            <div className="alert-table-head">
              <span>{t('Time','समय')}</span>
              <span>{t('Camera','कैमरा')}</span>
              <span>{t('Zone Type','क्षेत्र प्रकार')}</span>
              <span>{t('Alert Type','अलर्ट प्रकार')}</span>
              <span>{t('Message','संदेश')}</span>
              <span>{t('Severity','गंभीरता')}</span>
              <span>{t('Risk','जोखिम')}</span>
              <span>{t('Action','कार्रवाई')}</span>
            </div>
            <div className="alert-table-body">
              {acknowledgedAlerts.map((a, i) => {
                const cfg = SEV_CFG[a.severity] || SEV_CFG.Low
                const ztColor = a.zone_type === 'restricted' ? '#ef4444'
                  : a.zone_type === 'safe' ? '#eab308' : '#00d4ff'
                return (
                  <div key={a.id} className="alert-table-row" style={{ borderLeftColor: '#eab308' }}>
                    <span className="col-mono">{a.timestamp}</span>
                    <span className="col-mono col-bold">{a.camera_id || '—'}</span>
                    <span className="col-mono" style={{ color: ztColor, fontWeight: 700, fontSize: 9, letterSpacing: 1 }}>
                      {a.zone_type?.toUpperCase() || '—'}
                    </span>
                    <span style={{ fontSize: 11 }}>{a.alert_type || a.type || '—'}</span>
                    <span className="col-msg">{a.message}</span>
                    <span className="col-sev" style={{ color: cfg.color, background: cfg.bg }}>{a.severity}</span>
                    <span className="col-mono" style={{ color: a.risk_score > 70 ? '#ef4444' : a.risk_score > 40 ? '#eab308' : '#22c55e' }}>
                      {a.risk_score ?? '—'}
                    </span>
                    <span className="col-actions">
                      <button className="tbl-btn" onClick={() => handleView(a)}>View</button>
                      <button className="tbl-btn tbl-btn-resolve" onClick={() => handleResolve(a.id)}>Resolve</button>
                      <button className="tbl-btn tbl-btn-del" onClick={() => handleDelete(a.id)}>Del</button>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Resolved Alerts Section */}
      {resolvedAlerts.length > 0 && (
        <>
          <div className="section-header">
            <div className="section-title">✅ Resolved (Solve ho gaye)</div>
            <div className="count-badge" style={{ background: 'rgba(61,184,122,0.15)', color: '#3db87a', border: '1px solid rgba(61,184,122,0.3)' }}>{resolvedAlerts.length}</div>
          </div>
          <div className="alert-table-wrap">
            <div className="alert-table-head">
              <span>{t('Time','समय')}</span>
              <span>{t('Camera','कैमरा')}</span>
              <span>{t('Zone Type','क्षेत्र प्रकार')}</span>
              <span>{t('Alert Type','अलर्ट प्रकार')}</span>
              <span>{t('Message','संदेश')}</span>
              <span>{t('Severity','गंभीरता')}</span>
              <span>{t('Risk','जोखिम')}</span>
              <span>{t('Action','कार्रवाई')}</span>
            </div>
            <div className="alert-table-body">
              {resolvedAlerts.map((a, i) => {
                const cfg = SEV_CFG[a.severity] || SEV_CFG.Low
                const ztColor = a.zone_type === 'restricted' ? '#ef4444'
                  : a.zone_type === 'safe' ? '#eab308' : '#00d4ff'
                return (
                  <div key={a.id} className="alert-table-row" style={{ borderLeftColor: '#3db87a', opacity: 0.7 }}>
                    <span className="col-mono">{a.timestamp}</span>
                    <span className="col-mono col-bold">{a.camera_id || '—'}</span>
                    <span className="col-mono" style={{ color: ztColor, fontWeight: 700, fontSize: 9, letterSpacing: 1 }}>
                      {a.zone_type?.toUpperCase() || '—'}
                    </span>
                    <span style={{ fontSize: 11 }}>{a.alert_type || a.type || '—'}</span>
                    <span className="col-msg">{a.message}</span>
                    <span className="col-sev" style={{ color: cfg.color, background: cfg.bg }}>{a.severity}</span>
                    <span className="col-mono" style={{ color: a.risk_score > 70 ? '#ef4444' : a.risk_score > 40 ? '#eab308' : '#22c55e' }}>
                      {a.risk_score ?? '—'}
                    </span>
                    <span className="col-actions">
                      <button className="tbl-btn" onClick={() => handleView(a)}>View</button>
                      <button className="tbl-btn tbl-btn-del" onClick={() => handleDelete(a.id)}>Del</button>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Alert Details</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedAlert.alert_type === 'criminal_detected' && (
                <div className="criminal-alert-banner">
                  <div className="criminal-banner-icon">🚨</div>
                  <div>
                    <div className="criminal-banner-title">HIGH THREAT DETECTED</div>
                    <div className="criminal-banner-subtitle">Immediate action required</div>
                  </div>
                </div>
              )}
              
              {selectedAlert.suspect_name && (
                <div className="modal-row criminal-name-row">
                  <span className="modal-label">Suspect Name:</span>
                  <span className="modal-value criminal-name">{selectedAlert.suspect_name}</span>
                </div>
              )}
              
              <div className="modal-row">
                <span className="modal-label">Time:</span>
                <span className="modal-value">{selectedAlert.timestamp}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Camera:</span>
                <span className="modal-value">{selectedAlert.camera_id || '—'}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Zone:</span>
                <span className="modal-value">{selectedAlert.zone}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Zone Type:</span>
                <span className="modal-value" style={{ 
                  color: selectedAlert.zone_type === 'restricted' ? '#ef4444' 
                    : selectedAlert.zone_type === 'safe' ? '#eab308' : '#00d4ff',
                  fontWeight: 700
                }}>
                  {selectedAlert.zone_type?.toUpperCase() || '—'}
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Alert Type:</span>
                <span className="modal-value">{selectedAlert.alert_type || selectedAlert.type}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Severity:</span>
                <span className="modal-value" style={{ 
                  color: SEV_CFG[selectedAlert.severity]?.color || '#3db87a',
                  fontWeight: 700
                }}>
                  {selectedAlert.severity}
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Risk Score:</span>
                <span className="modal-value" style={{ 
                  color: selectedAlert.risk_score > 70 ? '#ef4444' 
                    : selectedAlert.risk_score > 40 ? '#eab308' : '#22c55e',
                  fontWeight: 700
                }}>
                  {selectedAlert.risk_score ?? '—'}
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Confidence:</span>
                <span className="modal-value">{selectedAlert.confidence ? `${selectedAlert.confidence}%` : '—'}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Message:</span>
                <span className="modal-value">{selectedAlert.message}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Status:</span>
                <span className="modal-value" style={{ 
                  color: selectedAlert.status === 'Active' ? '#ef4444' : '#3db87a',
                  fontWeight: 700
                }}>
                  {selectedAlert.status}
                </span>
              </div>
              
              {/* Action Suggestions */}
              <div className="modal-divider"></div>
              <div className="modal-section-title">Suggested Actions</div>
              <div className="action-suggestions">
                {getActionSuggestions(selectedAlert).map((action, idx) => (
                  <div key={idx} className="action-chip">{action}</div>
                ))}
              </div>

              {/* Image if available */}
              {selectedAlert.image && (
                <>
                  <div className="modal-divider"></div>
                  <div className="modal-section-title">Alert Image</div>
                  <img 
                    src={`${import.meta.env.VITE_API_URL}/images/${selectedAlert.image}`} 
                    alt="Alert" 
                    className="modal-alert-img"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
