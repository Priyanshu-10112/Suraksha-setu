import React from 'react'

const TYPE_COLORS = {
  weapon:    '#ef4444',
  intrusion: '#ef4444',
  bag:       '#f97316',
  crowd:     '#eab308',
  person:    '#ef4444',
  default:   '#ef4444',
}

export function DetectionBox({ det }) {
  const color = TYPE_COLORS[det.type?.toLowerCase()] || TYPE_COLORS.default
  return (
    <div className="det-box" style={{ left: det.x, top: det.y, width: det.w, height: det.h, borderColor: color }}>
      <span className="dc dc-tl" style={{ borderColor: color }} />
      <span className="dc dc-tr" style={{ borderColor: color }} />
      <span className="dc dc-bl" style={{ borderColor: color }} />
      <span className="dc dc-br" style={{ borderColor: color }} />
      <div className="det-tag" style={{ borderColor: color }}>
        <span className="det-label">{det.label}</span>
        <div className="det-conf-bar">
          <div className="det-conf-fill" style={{ width: `${det.confidence}%`, background: color }} />
        </div>
        <span className="det-conf-val">{det.confidence}%</span>
      </div>
    </div>
  )
}

export function FeedCell({ camId, label, detections = [], children }) {
  return (
    <div className="feed-cell">
      <div className="feed-cell-header">
        <span className="feed-cell-cam">{camId}</span>
        <span className="feed-cell-label">{label}</span>
        <span className="feed-cell-live"><span className="rec-dot" />LIVE</span>
      </div>
      <div className="feed-cell-video">
        <div className="coord-grid" />
        <span className="bracket br-tl" /><span className="bracket br-tr" />
        <span className="bracket br-bl" /><span className="bracket br-br" />
        {children}
        {detections.map(d => <DetectionBox key={d.id} det={d} />)}
        {detections.length === 0 && <div className="feed-no-threat">NO THREAT</div>}
      </div>
    </div>
  )
}
