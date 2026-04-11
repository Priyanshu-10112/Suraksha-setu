import React, { useEffect } from 'react'
import { useSurveillance } from '../../context/SurveillanceContext'
import CameraFeed from '../../components/CameraFeed'
import AlertPanel from '../../components/AlertPanel'
import { getCameras } from '../../services/api'

export default function LiveSurveillance() {
  const { cameras, setCamerasData, alerts, systemStatus, wsConnected, t } = useSurveillance()
  const activeThreats = alerts.filter(a => a.status === 'Active').length

  useEffect(() => {
    getCameras()
      .then(data => { if (data?.cameras?.length) setCamerasData(data.cameras) })
      .catch(() => {})
  }, [setCamerasData])

  return (
    <div className="page-inner">
      <div className="stats-row">
        <div className={`stat-card ${activeThreats > 0 ? 'stat-danger' : 'stat-ok'}`}>
          <div className="stat-val">{activeThreats}</div>
          <div className="stat-label">{t('Active Threats','सक्रिय खतरे')}</div>
        </div>
        <div className="stat-card stat-ok">
          <div className="stat-val">{cameras.filter(c => c.status === 'Online').length}/{cameras.length}</div>
          <div className="stat-label">{t('Cameras Online','कैमरे ऑनलाइन')}</div>
        </div>
        <div className={`stat-card ${wsConnected ? 'stat-ok' : 'stat-warn'}`}>
          <div className="stat-val">{wsConnected ? 'LIVE' : 'OFFLINE'}</div>
          <div className="stat-label">{t('WebSocket','वेबसॉकेट')}</div>
        </div>
        <div className={`stat-card ${systemStatus !== 'OPERATIONAL' ? 'stat-danger' : 'stat-ok'}`}>
          <div className="stat-val">{systemStatus !== 'OPERATIONAL' ? t('ALERT','अलर्ट') : t('SECURE','सुरक्षित')}</div>
          <div className="stat-label">{t('System Status','सिस्टम स्थिति')}</div>
        </div>
      </div>

      {cameras.length === 0 ? (
        <div className="stat-card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
          No cameras registered. Go to <strong>Camera Management</strong> to add cameras.
        </div>
      ) : (
        <div className="feed-grid-2x2">
          {cameras.slice(0, 4).map(cam => (
            <CameraFeed key={cam.id} camera={cam} detections={[]} />
          ))}
        </div>
      )}

      <AlertPanel maxItems={10} />
    </div>
  )
}
