import { useEffect } from 'react'
import { useSurveillance } from '../../context/SurveillanceContext'
import { getCameras, getZones } from '../../services/api'
import { useState } from 'react'

const STATUS_COLOR = { Online: '#22c55e', Offline: '#ef4444', Open: '#22c55e', Crowded: '#f97316', Closed: '#ef4444' }

export default function ZoneView() {
  const { cameras, setCamerasData, t } = useSurveillance()
  const [allZones, setAllZones] = useState([])

  useEffect(() => {
    getCameras()
      .then(data => { if (data?.cameras?.length) setCamerasData(data.cameras) })
      .catch(() => {})
  }, [setCamerasData])

  useEffect(() => {
    if (!cameras.length) return
    Promise.all(
      cameras.map(c =>
        getZones(c.camera_id || c.id)
          .then(d => (d?.zones || []).map(z => ({ ...z, camera_id: c.camera_id || c.id, location: c.location })))
          .catch(() => [])
      )
    ).then(results => setAllZones(results.flat()))
  }, [cameras])

  return (
    <div className="page-inner">
      <div className="section-header">
        <span className="section-title">{t('Zone View','क्षेत्र दृश्य')}</span>
        <span className="readonly-badge">{t('Read Only','केवल पढ़ें')}</span>
      </div>

      {cameras.length === 0 && (
        <div className="ap-empty">{t('No cameras registered','कोई कैमरा नहीं')}</div>
      )}

      <div className="zone-cards-col" style={{ maxHeight: 'none', overflow: 'visible' }}>
        {cameras.map(cam => {
          const id = cam.camera_id || cam.id
          const camZones = allZones.filter(z => z.camera_id === id)
          const col = STATUS_COLOR[cam.status] || '#22c55e'
          return (
            <div key={id} className="zone-detail-card">
              <div className="zdc-top">
                <div>
                  <div className="zdc-id">{id}</div>
                  <div className="zdc-name">{cam.location}</div>
                </div>
                <span className="zdc-badge" style={{ color: col, borderColor: col }}>{cam.status}</span>
              </div>
              <div className="zdc-meta">
                <span>Type: {cam.type}</span>
                <span>Zones: {camZones.length}</span>
              </div>
              {camZones.map(z => {
                const zCol = z.zone_type === 'restricted' ? '#ef4444' : z.zone_type === 'safe' ? '#22c55e' : '#00d4ff'
                return (
                  <div key={z.id} className="cm-zone-item" style={{ marginTop: 4 }}>
                    <span className="cm-mono" style={{ color: zCol }}>
                      [{z.zone_type?.toUpperCase() || 'ZONE'}] #{z.id} ({z.x1},{z.y1})→({z.x2},{z.y2})
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
