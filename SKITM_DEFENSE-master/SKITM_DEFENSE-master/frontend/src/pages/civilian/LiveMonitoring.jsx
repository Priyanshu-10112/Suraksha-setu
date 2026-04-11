import { useEffect } from 'react'
import { useSurveillance } from '../../context/SurveillanceContext'
import CameraFeed from '../../components/CameraFeed'
import { getCameras } from '../../services/api'

export default function LiveMonitoring() {
  const { cameras, setCamerasData, civilianAlerts, t } = useSurveillance()
  const activeAlerts = civilianAlerts.filter(a => a.status === 'Active').length

  useEffect(() => {
    getCameras()
      .then(data => { if (data?.cameras?.length) setCamerasData(data.cameras) })
      .catch(() => {})
  }, [setCamerasData])

  return (
    <div className="page-inner">
      <div className="stats-row">
        <div className={`stat-card ${activeAlerts > 0 ? 'stat-warn' : 'stat-ok'}`}>
          <div className="stat-val">{activeAlerts}</div>
          <div className="stat-label">{t('Active Alerts','सक्रिय अलर्ट')}</div>
        </div>
        <div className="stat-card stat-ok">
          <div className="stat-val">{cameras.filter(c => c.status === 'Online').length}/{cameras.length}</div>
          <div className="stat-label">{t('Cameras Active','कैमरे सक्रिय')}</div>
        </div>
        <div className="stat-card stat-ok">
          <div className="stat-val">{t('NORMAL','सामान्य')}</div>
          <div className="stat-label">{t('Status','स्थिति')}</div>
        </div>
      </div>

      {cameras.length === 0 ? (
        <div className="stat-card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
          No cameras registered.
        </div>
      ) : (
        <div className="feed-grid-2x2">
          {cameras.slice(0, 4).map(cam => (
            <CameraFeed key={cam.id} camera={cam} detections={[]} />
          ))}
        </div>
      )}
    </div>
  )
}
