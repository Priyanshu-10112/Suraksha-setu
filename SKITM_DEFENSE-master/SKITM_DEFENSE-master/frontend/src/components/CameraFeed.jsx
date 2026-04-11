import React, { memo, useState, useEffect, useRef } from 'react'
import { getStreamUrl } from '../services/api'
import { DetectionBox } from './DetectionOverlay'

// Tries MJPEG stream first; falls back to frame polling every 500ms.
const CameraFeed = memo(function CameraFeed({ camera, detections = [] }) {
  const { id: cameraId, location, status } = camera
  const [mode, setMode] = useState('stream')
  const [frameSrc, setFrameSrc] = useState('')
  const pollRef = useRef(null)
  const streamUrl = getStreamUrl(cameraId)

  // Frame polling fallback — poll /api/stream/video_feed every 500ms
  useEffect(() => {
    if (mode !== 'poll') return
    const poll = () => setFrameSrc(`${getStreamUrl(cameraId)}&t=${Date.now()}`)
    poll()
    pollRef.current = setInterval(poll, 500)
    return () => clearInterval(pollRef.current)
  }, [mode, cameraId])

  const handleStreamError = () => {
    // MJPEG failed — try frame polling
    if (mode === 'stream') setMode('poll')
    else setMode('offline')
  }

  return (
    <div className="feed-cell">
      <div className="feed-cell-header">
        <span className="feed-cell-cam">{cameraId}</span>
        <span className="feed-cell-label">{location}</span>
        <span className="feed-cell-live">
          <span className={`rec-dot ${status !== 'Online' ? 'dot-offline' : ''}`} />
          {status === 'Online' ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      <div className="feed-cell-video">
        <div className="coord-grid" />
        <span className="bracket br-tl" /><span className="bracket br-tr" />
        <span className="bracket br-bl" /><span className="bracket br-br" />

        {mode === 'stream' && (
          <img
            src={streamUrl}
            alt={`Feed ${cameraId}`}
            className="feed-img"
            onError={handleStreamError}
          />
        )}

        {mode === 'poll' && frameSrc && (
          <img src={frameSrc} alt={`Frame ${cameraId}`} className="feed-img" onError={handleStreamError} />
        )}

        {mode === 'offline' && (
          <div className="feed-offline">
            <span>⚠</span>
            <span>Feed Unavailable</span>
            <button className="feed-retry-btn" onClick={() => setMode('stream')}>Retry</button>
          </div>
        )}

        {/* Detection overlays */}
        {detections.map(d => <DetectionBox key={d.id} det={d} />)}

        {detections.length === 0 && mode !== 'offline' && (
          <div className="feed-no-threat">NO THREAT</div>
        )}
      </div>
    </div>
  )
})

export default CameraFeed
