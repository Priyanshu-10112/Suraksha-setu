import React, { useEffect } from 'react'
import { useSurveillance } from '../../context/SurveillanceContext'
import CameraControls from '../../components/CameraControls'
import { getCameras } from '../../services/api'

export default function Settings() {
  const { cameras, setCamerasData, t } = useSurveillance()

  useEffect(() => {
    getCameras()
      .then(data => { if (data?.cameras?.length) setCamerasData(data.cameras) })
      .catch(() => {})
  }, [setCamerasData])

  return (
    <div className="page-inner">
      <div className="section-header">
        <span className="section-title">{t('Camera Control Panel','कैमरा नियंत्रण पैनल')}</span>
        <span className="count-badge red">{cameras.length} {t('cameras','कैमरे')}</span>
      </div>
      <div className="cam-ctrl-grid">
        {cameras.map(cam => (
          <CameraControls key={cam.id} camera={cam} />
        ))}
      </div>
    </div>
  )
}
