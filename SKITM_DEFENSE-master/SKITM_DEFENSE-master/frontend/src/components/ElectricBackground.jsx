import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import RadarPulse from './RadarPulse'

// Draws animated electric arcs on a canvas — pure GPU-friendly canvas ops
function ElectricCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Electric arc segments
    const arcs = Array.from({ length: 6 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      life: Math.random(),
      maxLife: 0.6 + Math.random() * 0.4,
      segments: 8 + Math.floor(Math.random() * 6),
      length: 60 + Math.random() * 80,
    }))

    let pulse = 0
    let pulseTimer = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Pulse flash every ~4s
      pulseTimer++
      if (pulseTimer > 240) {
        pulse = 1
        pulseTimer = 0
      }
      if (pulse > 0) {
        ctx.fillStyle = `rgba(0,212,255,${pulse * 0.03})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        pulse -= 0.04
      }

      arcs.forEach(arc => {
        arc.life += 0.008
        if (arc.life > arc.maxLife) {
          arc.x = Math.random() * canvas.width
          arc.y = Math.random() * canvas.height
          arc.vx = (Math.random() - 0.5) * 0.4
          arc.vy = (Math.random() - 0.5) * 0.4
          arc.life = 0
          arc.maxLife = 0.6 + Math.random() * 0.4
          arc.segments = 8 + Math.floor(Math.random() * 6)
          arc.length = 60 + Math.random() * 80
        }

        arc.x += arc.vx
        arc.y += arc.vy

        const alpha = Math.sin((arc.life / arc.maxLife) * Math.PI) * 0.35

        // Draw jagged electric arc
        ctx.beginPath()
        ctx.strokeStyle = `rgba(0,212,255,${alpha})`
        ctx.lineWidth = 1
        ctx.shadowBlur = 8
        ctx.shadowColor = '#00d4ff'

        let cx = arc.x, cy = arc.y
        const angle = Math.random() * Math.PI * 2
        const segLen = arc.length / arc.segments

        ctx.moveTo(cx, cy)
        for (let i = 0; i < arc.segments; i++) {
          const jitter = (Math.random() - 0.5) * 18
          cx += Math.cos(angle) * segLen + jitter
          cy += Math.sin(angle) * segLen + jitter
          ctx.lineTo(cx, cy)
        }
        ctx.stroke()
        ctx.shadowBlur = 0
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="electric-canvas" />
}

export default function ElectricBackground() {
  return (
    <div className="electric-bg" aria-hidden="true">
      {/* Layer 1: dark base */}
      <div className="eb-base" />
      {/* Layer 2: animated grid */}
      <div className="eb-grid" />
      {/* Layer 3: horizontal scan line */}
      <div className="eb-scan" />
      {/* Layer 4: canvas electric arcs */}
      <ElectricCanvas />
      {/* Layer 5: centered radar pulse */}
      <RadarPulse x="50%" y="50%" />
      {/* Layer 6: dark overlay for readability */}
      <div className="eb-overlay" />
    </div>
  )
}
