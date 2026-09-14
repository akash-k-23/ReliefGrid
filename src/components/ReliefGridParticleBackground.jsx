import { useEffect, useRef } from 'react'

const palette = [
  [34, 211, 238],
  [59, 130, 246],
  [129, 140, 248],
  [167, 139, 250],
  [103, 232, 249],
]

function seededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

export default function ReliefGridParticleBackground({ variant = 'subtle' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const isCoarsePointer = window.matchMedia('(pointer: coarse)')
    const random = seededRandom(72419)
    const particles = []
    const mouse = { x: 0, y: 0, active: false }
    let width = 0
    let height = 0
    let pixelRatio = 1
    let frameId
    let lastTime = 0
    let motionScale = reducedMotion.matches ? 0.08 : 1
    let isVisible = !document.hidden

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * pixelRatio)
      canvas.height = Math.floor(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      const targetCount = variant === 'hero'
        ? (width < 640 ? 82 : width < 1024 ? 138 : 226)
        : (width < 640 ? 46 : width < 1024 ? 76 : 118)

      particles.length = 0
      for (let index = 0; index < targetCount; index += 1) {
        const depth = 0.18 + random() * 0.82
        const color = palette[Math.floor(random() * palette.length)]
        particles.push({
          x: random() * width,
          y: random() * height,
          radius: 0.7 + depth * (variant === 'hero' ? 8.2 : 6.2),
          alpha: 0.08 + depth * 0.26,
          color,
          vx: (random() - 0.5) * (0.035 + depth * 0.09),
          vy: (random() - 0.5) * (0.025 + depth * 0.07),
          drift: random() * Math.PI * 2,
          driftSpeed: 0.00025 + random() * 0.00055,
          pulse: random() * Math.PI * 2,
          pulseSpeed: 0.00045 + random() * 0.0009,
        })
      }
    }

    const handlePointerMove = (event) => {
      if (isCoarsePointer.matches) return
      mouse.x = event.clientX
      mouse.y = event.clientY
      mouse.active = true
    }

    const handlePointerLeave = () => {
      mouse.active = false
    }

    const handleMotionPreference = (event) => {
      motionScale = event.matches ? 0.08 : 1
    }

    const handleVisibilityChange = () => {
      isVisible = !document.hidden
      if (isVisible && !frameId) frameId = requestAnimationFrame(render)
    }

    const render = (time) => {
      frameId = undefined
      if (!isVisible) return
      const elapsed = Math.min(time - lastTime || 16, 48)
      lastTime = time
      context.clearRect(0, 0, width, height)

      for (const particle of particles) {
        particle.drift += particle.driftSpeed * elapsed
        particle.pulse += particle.pulseSpeed * elapsed
        particle.x += (particle.vx + Math.sin(particle.drift) * 0.018) * elapsed * motionScale
        particle.y += (particle.vy + Math.cos(particle.drift * 0.82) * 0.014) * elapsed * motionScale

        if (particle.x < -particle.radius) particle.x = width + particle.radius
        if (particle.x > width + particle.radius) particle.x = -particle.radius
        if (particle.y < -particle.radius) particle.y = height + particle.radius
        if (particle.y > height + particle.radius) particle.y = -particle.radius

        if (mouse.active && motionScale > 0.1) {
          const dx = particle.x - mouse.x
          const dy = particle.y - mouse.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < 150 && distance > 0) {
            const influence = (1 - distance / 150) * 0.018
            particle.x += (dx / distance) * influence * elapsed
            particle.y += (dy / distance) * influence * elapsed
          }
        }

        const pulse = 0.84 + Math.sin(particle.pulse) * 0.16
        const alpha = particle.alpha * pulse
        const [red, green, blue] = particle.color
        const glow = context.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 3.8,
        )
        glow.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.42})`)
        glow.addColorStop(0.35, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.12})`)
        glow.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
        context.fillStyle = glow
        context.beginPath()
        context.arc(particle.x, particle.y, particle.radius * 3.8, 0, Math.PI * 2)
        context.fill()

        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`
        context.beginPath()
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fill()
      }

      frameId = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)
    reducedMotion.addEventListener('change', handleMotionPreference)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    frameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      reducedMotion.removeEventListener('change', handleMotionPreference)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [variant])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_0%,rgba(15,31,53,0.18),rgba(7,17,31,0.88))]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07111f]/25 via-[#07111f]/65 to-[#07111f]/96" />
    </div>
  )
}
