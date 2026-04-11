import { useEffect, useRef } from 'react'

export default function RadarMapBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    let animationId

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    const worldMap = [
      [[100,100],[190,140],[100,113]],
      [[155,165],[190,197],[154,170]],
      [[270,75],[315,82],[272,80]],
      [[275,105],[330,143],[276,112]],
      [[315,65],[430,110],[313,73]],
      [[340,115],[371,135],[338,122]],
      [[370,145],[400,163],[369,151]],
      [[375,195],[435,220],[371,199]],
      [[50,260],[450,260],[50,270]],
    ]

    let sweepAngle = 0
    let pulseRadius = 0
    let gridOffset = 0

    const animate = () => {
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.fillStyle = '#050810'
      ctx.fillRect(0, 0, w, h)

      for (let i = 0; i < 40; i++) {
        const x = Math.random() * w
        const y = Math.random() * h
        ctx.fillStyle = `rgba(20,40,30,${Math.random() * 0.03})`
        ctx.fillRect(x, y, 2, 2)
      }

      const centerX = w / 2
      const centerY = h / 2
      const maxRadius = Math.min(w, h) * 0.4

      ctx.strokeStyle = 'rgba(34,197,94,0.4)'
      ctx.lineWidth = 2
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, (maxRadius / 5) * i, 0, Math.PI * 2)
        ctx.stroke()
      }

      gridOffset += 0.002
      ctx.lineWidth = 2
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i + gridOffset
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(
          centerX + Math.cos(angle) * maxRadius,
          centerY + Math.sin(angle) * maxRadius
        )
        ctx.strokeStyle = 'rgba(34,197,94,0.3)'
        ctx.stroke()
      }

      ctx.save()
      ctx.translate(centerX - 250, centerY - 130)
      ctx.scale(1.2, 1.2)

      worldMap.forEach(continent => {
        ctx.beginPath()
        ctx.moveTo(continent[0][0], continent[0][1])
        continent.forEach(([x, y]) => ctx.lineTo(x, y))
        ctx.closePath()
        ctx.fillStyle = 'rgba(34,197,94,0.4)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(34,197,94,0.8)'
        ctx.lineWidth = 3
        ctx.stroke()
      })

      ctx.restore()

      sweepAngle += 0.015
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(sweepAngle)

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius)
      grad.addColorStop(0, 'rgba(34,197,94,0.8)')
      grad.addColorStop(0.5, 'rgba(34,197,94,0.4)')
      grad.addColorStop(1, 'transparent')

      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, maxRadius, 0, Math.PI / 3)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      ctx.restore()

      pulseRadius = (Math.sin(Date.now() * 0.003) + 1) * 3 + 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(34,197,94,0.8)'
      ctx.shadowBlur = 15
      ctx.shadowColor = 'rgba(34,197,94,0.6)'
      ctx.fill()
      ctx.shadowBlur = 0

      const scanY = (Date.now() * 0.05) % h
      ctx.beginPath()
      ctx.moveTo(0, scanY)
      ctx.lineTo(w, scanY)
      ctx.strokeStyle = 'rgba(34,197,94,0.1)'
      ctx.stroke()

      ctx.strokeStyle = 'rgba(34,197,94,0.15)'
      ctx.lineWidth = 1
      const gridSize = 40
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      ctx.font = '10px monospace'
      ctx.fillStyle = 'rgba(34,197,94,0.4)'
      ctx.fillText('SURAKSHA-SETU', 40, 30)
      ctx.fillText('STATUS: ACTIVE', w - 140, h - 20)

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
