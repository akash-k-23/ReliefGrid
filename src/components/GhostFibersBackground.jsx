import { useEffect, useRef } from 'react'

export default function GhostFibersBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let isVisible = !document.hidden
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    let mouse = { x: width / 2, y: height / 2, active: false }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }

    const handleMouseLeave = () => {
      mouse.active = false
    }

    const handleVisibilityChange = () => {
      isVisible = !document.hidden
      if (isVisible && !animationFrameId) animationFrameId = requestAnimationFrame(render)
    }

    const handleMotionPreference = () => {
      if (reducedMotion.matches) cancelAnimationFrame(animationFrameId)
      else if (isVisible && !animationFrameId) animationFrameId = requestAnimationFrame(render)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    reducedMotion.addEventListener('change', handleMotionPreference)

    // Fiber strands and telemetry pulses
    const strandCount = Math.min(22, Math.floor(width / 65))
    const strands = []

    for (let i = 0; i < strandCount; i++) {
      strands.push({
        baseX: (width / strandCount) * i,
        speed: 0.25 + Math.random() * 0.35,
        wavelength: 130 + Math.random() * 110,
        amplitude: 22 + Math.random() * 38,
        phase: Math.random() * Math.PI * 2,
        colorType: i % 4 === 0 ? 'red' : i % 2 === 0 ? 'cyan' : 'blue',
        alpha: 0.07 + Math.random() * 0.1,
        signalY: Math.random() * height,
        signalSpeed: 2 + Math.random() * 2.5,
      })
    }

    // Interconnected relief node particles
    const particleCount = Math.min(36, Math.floor(width / 40))
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: 1 + Math.random() * 1.8,
        alpha: 0.12 + Math.random() * 0.22,
        pulse: Math.random() * Math.PI,
      })
    }

    let t = 0

    const render = () => {
      animationFrameId = undefined
      if (!isVisible || reducedMotion.matches) return
      t += 0.012
      ctx.clearRect(0, 0, width, height)

      // Draw undulating ghost fibers
      strands.forEach((strand) => {
        ctx.beginPath()
        let r = 59, g = 130, b = 246 // blue
        if (strand.colorType === 'red') {
          r = 239; g = 68; b = 68 // emergency red
        } else if (strand.colorType === 'cyan') {
          r = 6; g = 182; b = 212 // vital cyan
        }

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${strand.alpha})`
        ctx.lineWidth = 1.1

        let points = []
        for (let y = 0; y <= height; y += 16) {
          let wave = Math.sin(y / strand.wavelength + t * strand.speed + strand.phase) * strand.amplitude
          // Gentle mouse displacement
          if (mouse.active) {
            const dy = y - mouse.y
            const distY = Math.abs(dy)
            if (distY < 180) {
              const dx = (strand.baseX + wave) - mouse.x
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < 180) {
                const push = (1 - dist / 180) * 18
                wave += (dx > 0 ? 1 : -1) * push
              }
            }
          }

          const x = strand.baseX + wave
          points.push({ x, y })
          if (y === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()

        // Telemetry signal pulse travelling along fiber
        strand.signalY += strand.signalSpeed
        if (strand.signalY > height) strand.signalY = 0

        const currentSignalIndex = Math.floor((strand.signalY / height) * (points.length - 1))
        const p = points[currentSignalIndex] || points[0]
        if (p) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.75)`
          ctx.shadowBlur = 8
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`
          ctx.fill()
          ctx.shadowBlur = 0 // reset
        }
      })

      // Interconnected node network
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.pulse += 0.018

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        const dynamicAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(6, 182, 212, ${dynamicAlpha})`
        ctx.fill()

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(14, 165, 233, ${(1 - dist / 100) * 0.1})`
            ctx.lineWidth = 0.65
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    if (!reducedMotion.matches) render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      reducedMotion.removeEventListener('change', handleMotionPreference)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-65" />
      {/* High-contrast readability background overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(6,182,212,0.14),rgba(7,11,20,0.96))]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/50 via-[#070b14]/85 to-[#070b14]" />
    </div>
  )
}
