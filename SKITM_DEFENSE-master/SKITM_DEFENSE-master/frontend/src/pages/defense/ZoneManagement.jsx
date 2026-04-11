import React, { useState, useEffect } from 'react'
import { useSurveillance } from '../../context/SurveillanceContext'
import ZoneDrawer from '../../components/ZoneDrawer'
import { getZones, getCameras, getAlerts } from '../../services/api'

const STATUS_COLOR = { Secure: '#3db87a', Alert: '#ef4444', Warning: '#f97316', Online: '#3db87a', Offline: '#ef4444' }

export default function ZoneManagement() {
  const { cameras, setCamerasData, t } = useSurveillance()
  const [drawerCam, setDrawerCam]   = useState(null)
  const [savedZones, setSavedZones] = useState([])
  const [breachHistory, setBreachHistory] = useState([])

  // Fetch cameras
  useEffect(() => {
    getCameras()
      .then(data => { if (data?.cameras?.length) setCamerasData(data.cameras) })
      .catch(() => {})
  }, [setCamerasData])

  // Fetch zones for all cameras
  useEffect(() => {
    if (!cameras.length) return
    Promise.all(
      cameras.map(c =>
        getZones(c.camera_id || c.id)
          .then(d => (d?.zones || []).map(z => ({ ...z, camera_id: c.camera_id || c.id, location: c.location })))
          .catch(() => [])
      )
    ).then(results => setSavedZones(results.flat()))
  }, [cameras])

  // Fetch recent alerts as breach history
  useEffect(() => {
    getAlerts(10)
      .then(data => {
        if (data?.alerts) {
          setBreachHistory(data.alerts.map(a => ({
            time: a.timestamp ? new Date(a.timestamp).toLocaleTimeString('en-GB', { hour12: false }) : '—',
            camera: a.camera_id,
            location: a.location,
            event: a.message,
          })))
        }
      })
      .catch(() => {})
  }, [])

  const handleZoneSaved = (zoneData) => {
    setSavedZones(prev => [...prev, zoneData])
    setDrawerCam(null)
  }

  return (
    <div className="page-inner">
      {drawerCam && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ width: 700, maxWidth: '95vw' }}>
            <ZoneDrawer cameraId={drawerCam} onSaved={handleZoneSaved} onCancel={() => setDrawerCam(null)} />
          </div>
        </div>
      )}

      <div className="zone-layout">
        <div className="zone-map-col">
          <div className="section-header">
            <span className="section-title">{t('Camera Zones','कैमरा क्षेत्र')}</span>
            <select className="filter-select" style={{ fontSize: 10, padding: '4px 8px' }}
              onChange={e => e.target.value && setDrawerCam(e.target.value)} defaultValue="">
              <option value="">+ Draw Zone…</option>
              {cameras.map(c => (
                <option key={c.camera_id || c.id} value={c.camera_id || c.id}>
                  {c.camera_id || c.id} — {c.location}
                </option>
              ))}
            </select>
          </div>

          {/* Saved zones from backend */}
          {savedZones.length === 0 ? (
            <div className="map-card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-mut)', fontSize: 12 }}>
              {cameras.length === 0
                ? 'No cameras registered. Add cameras first.'
                : 'No zones configured. Use "Draw Zone" to add one.'}
            </div>
          ) : (
            <div className="map-card">
              {savedZones.map((z, i) => (
                <div key={i} className="zone-detail-card" style={{ marginBottom: 6 }}>
                  <div className="zdc-top">
                    <div>
                      <div className="zdc-id">Zone #{z.id}</div>
                      <div className="zdc-name">{z.location || z.camera_id}</div>
                    </div>
                    <span className="zdc-badge" style={{ color: '#3db87a', borderColor: '#3db87a' }}>Active</span>
                  </div>
                  <div className="zdc-meta">
                    <span>Cam: {z.camera_id}</span>
                    <span>({z.x1},{z.y1}) → ({z.x2},{z.y2})</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Breach history from real alerts */}
          <div className="section-header mt12">
            <span className="section-title">{t('Recent Events','हालिया घटनाएं')}</span>
          </div>
          <div className="timeline-list">
            {breachHistory.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-mut)', padding: '8px 0' }}>
                {t('No events yet','अभी कोई घटना नहीं')}
              </div>
            )}
            {breachHistory.map((b, i) => (
              <div key={i} className="timeline-item">
                <div className="tl-dot" />
                <div className="tl-content">
                  <span className="tl-time">{b.time}</span>
                  <span className="tl-zone">{b.camera}</span>
                  <span className="tl-event">{b.event}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Camera status cards */}
        <div className="zone-cards-col">
          <div className="section-header">
            <span className="section-title">{t('Camera Status','कैमरा स्थिति')}</span>
          </div>
          {cameras.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-mut)' }}>No cameras registered.</div>
          )}
          {cameras.map(cam => {
            const id = cam.camera_id || cam.id
            const camZones = savedZones.filter(z => z.camera_id === id)
            return (
              <div key={id} className="zone-detail-card">
                <div className="zdc-top">
                  <div>
                    <div className="zdc-id">{id}</div>
                    <div className="zdc-name">{cam.location}</div>
                  </div>
                  <span className="zdc-badge"
                    style={{ color: STATUS_COLOR[cam.status] || '#3db87a', borderColor: STATUS_COLOR[cam.status] || '#3db87a' }}>
                    {cam.status}
                  </span>
                </div>
                <div className="zdc-meta">
                  <span>Type: {cam.type}</span>
                  <span>Zones: {camZones.length}</span>
                </div>
                <div className="conf-bar-wrap">
                  <div className="conf-bar-fill" style={{ width: cam.status === 'Online' ? '100%' : '0%', background: STATUS_COLOR[cam.status] || '#3db87a' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
