import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { motion, useReducedMotion } from 'motion/react'
import {
  ShieldAlert,
  Users,
  Gamepad2,
  UserPlus,
  Radio,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Zap,
  ArrowDown
} from 'lucide-react'

import ElectricBorder from '../components/ElectricBorder'
import GhostFibersBackground from '../components/GhostFibersBackground'

export default function LandingPage() {
  const [isRevealed, setIsRevealed] = useState(false)
  const [activeInsight, setActiveInsight] = useState(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) {
      setIsRevealed(true)
      return undefined
    }
    const revealTimer = window.setTimeout(() => setIsRevealed(true), 500)
    return () => window.clearTimeout(revealTimer)
  }, [reduceMotion])

  const rainDrops = useMemo(() => Array.from({ length: 28 }, (_, index) => ({
    left: `${((index * 11) % 100)}%`,
    delay: `${(index * 0.28).toFixed(2)}s`,
    duration: `${(0.95 + (index % 6) * 0.26).toFixed(2)}s`,
    height: `${18 + (index % 9) * 8}px`,
    opacity: 0.2 + (index % 6) * 0.12,
  })), [])

  const pipelineStages = [
    {
      id: 'people-in-need',
      name: 'People In Need',
      title: 'Distress signal ignition',
      desc: 'Disaster victims transmit the exact location, urgency level, affected count, and critical resources needed so the first response layer can assess severity immediately.',
      badge: 'Beacon Active',
      color: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'bg-red-950/20',
      icon: ShieldAlert,
    },
    {
      id: 'reliefgrid',
      name: 'ReliefGrid',
      title: 'Signal triage and matching',
      desc: 'The central engine classifies incoming reports by geography, crisis type, and resource needs, then matches them with verified NGOs, volunteers, and stock availability.',
      badge: 'Automated Triage Engine',
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      icon: Radio,
    },
    {
      id: 'response-partners',
      name: 'NGOs • Volunteers • Donors',
      title: 'Field deployment and support',
      desc: 'Verified teams receive task-ready assignments and donors contribute targeted goods or funding, reducing duplication and making the response chain faster and more accountable.',
      badge: 'Aid Delivered',
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      icon: Users,
    },
  ]

  const steps = [

    {
      num: '01',
      name: 'REQUEST',
      title: 'Distress Ticket Broadcast',
      desc: 'Affected citizens or local responders transmit geolocated SOS alerts detailing specific supplies, vulnerabilities, and triage urgency.',
      icon: ShieldAlert,
      color: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'bg-red-950/20',
      badge: 'Immediate Ingestion',
    },
    {
      num: '02',
      name: 'MATCH',
      title: 'Smart Urgency Triage',
      desc: 'ReliefGrid clusters requirements by geographic sector and routes them to accredited NGOs and relief hubs with matching inventory.',
      icon: Zap,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      badge: 'Zero-Bottleneck',
    },
    {
      num: '03',
      name: 'COORDINATE',
      title: 'Field Volunteer Dispatch',
      desc: 'Skilled volunteer units (medical EMTs, boat rescue, logistics drivers) receive task tickets with verified delivery locations.',
      icon: Users,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      badge: 'Real-Time Routing',
    },
    {
      num: '04',
      name: 'DELIVER',
      title: 'Verified Shelter Handoff',
      desc: 'Essential supplies are distributed at shelter camps and homes, updating inventory manifests and closing distress tickets.',
      icon: CheckCircle2,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      badge: 'Verified Impact',
    },
  ]

  return (
    <div className="landing-shell relative min-h-screen overflow-hidden">
      {!isRevealed && <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#07111f]" role="status"><motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="text-center"><Radio className="mx-auto h-10 w-10 animate-pulse text-cyan-400" /><p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">ReliefGrid network</p></motion.div></div>}
      <div className="landing-rain-scene" aria-hidden="true">
        {!reduceMotion && rainDrops.map((drop, index) => (
          <span
            key={index}
            className="landing-rain-drop"
            style={{ left: drop.left, animationDelay: drop.delay, animationDuration: drop.duration, height: drop.height, opacity: drop.opacity }}
          />
        ))}
        <span className="landing-lightning" />
      </div>
      <GhostFibersBackground />

      {/* Hero Section */}
      <section className="relative pt-10 pb-20 md:pt-16 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="hidden xl:block absolute top-28 right-8 pointer-events-none">
          <motion.div
            animate={{ y: [8, -8, 8], rotate: [2, -2, 2] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md text-xs text-red-300 shadow-xl"
          >
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400"><HeartPulse className="w-4 h-4" /></div>
            <div><div className="font-bold text-[11px] text-white">Emergency EMT Dispatch</div><div className="text-[9px] text-slate-400">Trauma Units Standby</div></div>
          </motion.div>
        </div>

        {/* Urgent Live Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 shadow-xl backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="font-bold text-red-400 uppercase tracking-wider text-[10px]">
              Emergency Relief Network
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">Coordinated Multi-Disaster Response</span>
          </div>
        </motion.div>

        {/* Staggered Headline & Subtitle */}
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            Connecting Help.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">
              Delivering Hope.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            When roads are cut and essential services falter, Relief Grid helps communities and response partners find one another and move practical help where it is needed.
          </motion.p>

          {/* Primary CTA Buttons Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            {/* SOS Help Request with ElectricBorder */}
            <Link to="/login" className="group">
              <ElectricBorder color="red">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-red-950/80 transition-all"
                >
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                  <span>Access response tools</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              </ElectricBorder>
            </Link>

            <Link to="/register">
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-white font-semibold text-sm sm:text-base border border-slate-700/80 hover:border-cyan-500/50 shadow-lg backdrop-blur-md transition-all"
              >
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>Join the response network</span>
              </motion.div>
            </Link>

            <Link to="/game">
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-white font-semibold text-sm sm:text-base border border-slate-700/80 hover:border-emerald-500/50 shadow-lg backdrop-blur-md transition-all"
              >
                <Gamepad2 className="w-5 h-5 text-emerald-400" />
                <span>Play Awareness Game</span>
              </motion.div>
            </Link>

          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400"
          >
            <div className="flex items-center gap-2">
              <span>Are you an Organization?</span>
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2">
                Register Verified NGO
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ANIMATED VISUAL METAPHOR:
            PEOPLE IN NEED → RELIEFGRID → NGOs + VOLUNTEERS + DONORS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-16 max-w-4xl mx-auto rounded-3xl bg-slate-900/70 border border-slate-800 p-6 md:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
        >
          <div className="text-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800">
              Interactive Triage Architecture
            </span>
            <h3 className="text-xl font-bold text-white mt-2">
              The ReliefGrid Coordination Pipeline
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1">
              How distress signals are transformed into verified field actions in critical response windows.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
            {pipelineStages.map((stage, index) => {
              const Icon = stage.icon
              const isLast = index === pipelineStages.length - 1

              return (
                <div key={stage.id} className="contents">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveInsight(stage)}
                    className={`group w-full md:w-1/3 p-5 rounded-2xl border text-center relative shadow-lg ${stage.bg} ${stage.border} transition-all`}
                  >
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mx-auto mb-3 ${stage.color} bg-slate-950/60 ${stage.border}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-white text-sm md:text-base">{stage.name}</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {stage.title}
                    </p>
                    <div className={`mt-3 inline-block text-[10px] font-mono px-2 py-0.5 rounded border ${stage.border} ${stage.color} bg-slate-950/50`}>
                      {stage.badge}
                    </div>
                  </motion.button>

                  {!isLast && (
                    <div key={`${stage.id}-arrow`} className="flex flex-col items-center justify-center text-cyan-400">
                      <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
                        className="hidden md:block"
                      >
                        <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" />
                      </motion.div>
                      <ArrowDown className="w-5 h-5 block md:hidden animate-bounce text-cyan-400" />
                      <span className="text-[9px] font-mono text-slate-500 uppercase mt-1">{index === 0 ? 'Intake' : 'Dispatch'}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

      </section>

      <div className="landing-water-flow" aria-hidden="true">
        <span className="landing-water-flow__sheet" />
        <span className="landing-water-flow__ripple landing-water-flow__ripple--one" />
        <span className="landing-water-flow__ripple landing-water-flow__ripple--two" />
        <span className="landing-water-flow__ripple landing-water-flow__ripple--three" />
      </div>

      <section className="landing-story-section mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">A clearer path through the crisis</span>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-5xl">When every minute matters, connection is critical.</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">Relief Grid gives neighbors, volunteers, donors, and organizations a shared place to coordinate support when normal systems are under pressure.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="landing-story-card">
            <span className="landing-story-card__index">01 / SEE THE NEED</span>
            <h3>Make urgent needs visible</h3>
            <p>People affected by a disaster can share relief requests and the essentials their household or community needs.</p>
          </article>
          <article className="landing-story-card">
            <span className="landing-story-card__index">02 / CONNECT RESOURCES</span>
            <h3>Bring help closer together</h3>
            <p>Requests, live disaster information, volunteer opportunities, and relief resources meet in one coordinated response network.</p>
          </article>
          <article className="landing-story-card">
            <span className="landing-story-card__index">03 / TAKE PART</span>
            <h3>Every community can respond</h3>
            <p>Anyone can register or log in. Registered people can request relief and contribute through available programs; NGOs can register to coordinate their response.</p>
          </article>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/register" className="landing-story-link"><UserPlus className="h-4 w-4" /> Create an account <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/login" className="landing-story-secondary">Already registered? Sign in</Link>
        </div>
      </section>

      {/* HOW RELIEFGRID WORKS — 4-STEP ANIMATED FLOW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800">
            End-to-End Workflow
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-3">
            How ReliefGrid Works
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            From initial distress signal to certified delivery, every step is organized for maximum speed and accountability.
          </p>
        </div>

        {/* 4 Steps with connecting animated beam */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <motion.button
                type="button"
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                whileHover={{ y: -6 }}
                onClick={() => setActiveInsight(step)}
                className={`p-6 rounded-3xl border backdrop-blur-md ${step.bg} ${step.border} flex flex-col justify-between relative shadow-xl text-left`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-slate-600">
                      {step.num}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${step.border} ${step.color} uppercase tracking-wider`}>
                      {step.name}
                    </span>
                  </div>

                  <div className={`w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 ${step.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>{step.badge}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </motion.button>
            )
          })}
        </div>
      </section>

      {activeInsight && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-lg rounded-[28px] border border-cyan-500/30 bg-slate-950/90 p-6 shadow-[0_30px_80px_rgba(34,211,238,0.23)]"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${activeInsight.border} bg-slate-900/80 ${activeInsight.color}`}>
                  {(() => {
                    const Icon = activeInsight.icon || Radio
                    return <Icon className="h-5 w-5" />
                  })()}
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">ReliefGrid</p>
                  <h3 className="mt-1 text-lg font-black text-white">{activeInsight.title || activeInsight.name}</h3>
                </div>
              </div>
              <button type="button" onClick={() => setActiveInsight(null)} className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200">Close</button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Pipeline detail</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{activeInsight.desc}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Awareness Game Callout */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-cyan-950/50 border border-purple-500/20 p-8 md:p-12 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
        >
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
              <Gamepad2 className="w-4 h-4" />
              Community Readiness Simulation
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Test Your Disaster Preparedness
            </h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Do you know the critical 3-step action for flood surge safety or how to triage emergency medical supplies? Take our quick interactive readiness quiz.
            </p>
          </div>
          <Link to="/game">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-950 transition-all flex items-center gap-2"
            >
              <span>Play Awareness Quiz</span>
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
