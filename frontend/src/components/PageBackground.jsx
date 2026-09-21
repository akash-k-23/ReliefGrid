import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'

// Raster scene assets keep the disaster-response environment in the image itself.
const asset = (name) => `/assets/backgrounds/${name}`

const backgrounds = {
  landing: { label: 'disaster resilience command centre', tone: 'cyan', image: asset('landing-disaster-command.png'), position: 'center center' },
  login: { label: 'secure emergency communication room', tone: 'blue', image: asset('secure-emergency-control.jpg'), position: 'center center' },
  register: { label: 'community humanitarian relief centre', tone: 'amber', image: asset('community-relief-distribution.jpg'), position: 'center center' },
  operations: { label: 'disaster monitoring command centre', tone: 'cyan', image: asset('operations-disaster-center.jpg'), position: 'center center' },
  request: { label: 'flood response and community relief', tone: 'violet', image: asset('request-flood-rescue.jpg'), position: 'center center' },
  donor: { label: 'humanitarian supply distribution hub', tone: 'amber', image: asset('donor-humanitarian-supplies.jpg'), position: 'center center' },
  volunteer: { label: 'volunteer field-response team', tone: 'amber', image: asset('community-relief-distribution.jpg'), position: '42% center' },
  ngo: { label: 'NGO response coordination centre', tone: 'cyan', image: asset('operations-disaster-center.jpg'), position: '58% center' },
  admin: { label: 'secure emergency operations room', tone: 'blue', image: asset('secure-emergency-control.jpg'), position: '55% center' },
  profile: { label: 'connected humanitarian community', tone: 'amber', image: asset('community-relief-distribution.jpg'), position: '55% center' },
  explore: { label: 'wide disaster response network panorama', tone: 'cyan', image: asset('landing-disaster-command.png'), position: 'center center' },
  locations: { label: 'emergency response location network', tone: 'emerald', image: asset('operations-disaster-center.jpg'), position: 'center center' },
  game: { label: 'disaster-preparedness safety training environment', tone: 'emerald', image: asset('preparedness-safety-training.jpg'), position: 'center center' },
  results: { label: 'humanitarian recovery operations', tone: 'amber', image: asset('community-relief-distribution.jpg'), position: 'center center' },
  forgot: { label: 'secure emergency control room', tone: 'blue', image: asset('secure-emergency-control.jpg'), position: 'center center' },
  reset: { label: 'secure emergency control room', tone: 'blue', image: asset('secure-emergency-control.jpg'), position: 'center center' },
}

export default function PageBackground({ variant = 'operations' }) {
  const reduceMotion = useReducedMotion()
  const rootRef = useRef(null)
  const config = backgrounds[variant] || backgrounds.operations

  useEffect(() => {
    const element = rootRef.current
    const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
    if (!element || reduceMotion || lowPower || window.matchMedia('(max-width: 768px)').matches) return undefined

    const move = (event) => {
      const x = ((event.clientX / window.innerWidth) - 0.5) * 12
      const y = ((event.clientY / window.innerHeight) - 0.5) * 10
      element.style.setProperty('--parallax-x', `${x}px`)
      element.style.setProperty('--parallax-y', `${y}px`)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [reduceMotion])

  return (
    <div ref={rootRef} className={`page-background page-background--${config.tone} page-background--${variant}`} aria-hidden="true">
      <motion.img
        className="page-background__image"
        src={config.image}
        alt=""
        style={{ objectPosition: config.position }}
        onError={(event) => { event.currentTarget.hidden = true }}
        initial={reduceMotion ? false : { opacity: 0, scale: 1.025 }}
        animate={{ opacity: 1, scale: 1.04 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: 'easeOut' }}
      />
      <div className="page-background__wash" />
      <div className="page-background__atmosphere" />
      <span className="sr-only">{config.label}</span>
    </div>
  )
}
