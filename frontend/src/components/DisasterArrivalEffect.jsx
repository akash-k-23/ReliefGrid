import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, ChevronRight, Mountain, Waves } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

const burstPieces = Array.from({ length: 22 }, (_, index) => ({
  angle: `${index * (360 / 22)}deg`,
  delay: `${(index % 5) * 0.04}s`,
}))

export default function DisasterArrivalEffect() {
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(true)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (reduceMotion) {
      const timer = window.setTimeout(() => setVisible(false), 400)
      return () => window.clearTimeout(timer)
    }
    const closeTimer = window.setTimeout(() => setClosing(true), 1000)
    const hideTimer = window.setTimeout(() => setVisible(false), 1500)
    return () => {
      window.clearTimeout(closeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [reduceMotion])

  if (!visible) return null

  return (
    <motion.div initial={{ opacity: 1 }} animate={{ opacity: closing ? 0 : 1 }} transition={{ duration: .6, ease: 'easeInOut' }} className="disaster-intro disaster-intro--combined" aria-label="ReliefGrid disaster response introduction">
      <div className="disaster-intro__backdrop" />
      <div className="disaster-intro__horizon" />
      <div className="disaster-intro__burst" aria-hidden="true">{burstPieces.map((piece, index) => <i key={index} style={{ '--burst-angle': piece.angle, '--burst-delay': piece.delay }} />)}<b /></div>
      <div className="disaster-intro__flood" aria-hidden="true"><span /><span /><span /></div>
      <div className="disaster-intro__quake" aria-hidden="true"><span /><span /><span /></div>
      <div className="disaster-intro__landslide" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="disaster-intro__tsunami" aria-hidden="true"><span /><span /></div>
      <div className="disaster-intro__content">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 28, scale: .92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduceMotion ? 0 : .35 }} className="disaster-intro__title">
          <span className="disaster-intro__icon"><AlertTriangle /><Waves /><Activity /><Mountain /></span>
          <span className="disaster-intro__eyebrow">ReliefGrid emergency network</span>
          <strong>When crisis strikes, relief responds</strong>
          <small>Flood · Earthquake · Landslide · Tsunami · Fire</small>
        </motion.div>
        <div className="disaster-intro__progress"><span /></div>
        <p>Warning signals become coordinated help.</p>
      </div>
      <button type="button" onClick={() => setVisible(false)} className="disaster-intro__skip">Enter ReliefGrid <ChevronRight /></button>
    </motion.div>
  )
}
