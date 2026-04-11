import { useEffect, useRef } from 'react'

// Canvas-based wave animation for dashboard pages
function WaveCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Wave parameters
    const waves = [
      { y: 0.3, length: 0.015, amplitude: 40, frequency: 0.002, color: 'rgba(0,212,255,0.08)' },
      { y: 0.5, length: 0.02, amplitude: 30, frequency: 0.0015, color: 'rgba(59,130,246,0.06)' },
      { y: 0.7, length: 0.018, amplitude: 35, frequency: 0.0018, color: 'rgba(0,212,255,0.05)' },
    ]

    let increment = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      waves.forEach(wave => {
        ctx.beginPath()
        ctx.strokeStyle = wave.color
        ctx.lineWidth = 2
        ctx.shadowBlur = 10
        ctx.shadowColor = wave.color

        const yBase = canvas.height * wave.y

        for (let x = 0; x < canvas.width; x++) {
          const y = yBase + Math.sin(x * wave.length + increment * wave.frequency) * wave.amplitude
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()
        ctx.shadowBlur = 0
      })

      increment += 1
      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="wave-canvas" />
}

export default function WaveBackground() {
  return (
    <div className="wave-bg" aria-hidden="true">
      {/* Layer 1: dark base */}
      <div className="wb-base" />
      {/* Layer 2: animated grid */}
      <div className="wb-grid" />
      {/* Layer 3: canvas wave animation */}
      <WaveCanvas />
      {/* Layer 4: dark overlay for readability */}
      <div className="wb-overlay" />
    </div>
  )
}
