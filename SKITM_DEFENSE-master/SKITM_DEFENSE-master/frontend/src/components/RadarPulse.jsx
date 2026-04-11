// RadarPulse — 4 expanding CSS rings, pure CSS animation, no JS
export default function RadarPulse({ x = '50%', y = '50%' }) {
  return (
    <div className="radar-pulse-wrap" style={{ left: x, top: y }} aria-hidden="true">
      {[0, 1, 2, 3].map(i => (
        <span key={i} className="rp-ring" style={{ animationDelay: `${i * 0.9}s` }} />
      ))}
      <span className="rp-core" />
    </div>
  )
}
