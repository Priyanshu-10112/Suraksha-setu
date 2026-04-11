// Background.jsx — layered animated background for Suraksha-Setu
// Pure CSS, z-index: -1, pointer-events: none — completely non-interactive
export default function Background() {
  return (
    <div className="bg-root" aria-hidden="true">
      {/* Layer 1: animated base gradient */}
      <div className="bg-layer bg-base" />
      {/* Layer 2: moving tactical grid */}
      <div className="bg-layer bg-grid" />
      {/* Layer 3: slow scan lines */}
      <div className="bg-layer bg-scan" />
      {/* Layer 4: radar sweep (centered) */}
      <div className="bg-layer bg-radar" style={{ left: '50%', right: 'auto', transform: 'translateX(-50%)' }}>
        <div className="radar-ring" />
        <div className="radar-sweep" />
      </div>
    </div>
  )
}
