import { useEffect, useState } from 'react'
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
  ChevronRight,
  HeartPulse,
  Droplet,
  Zap,
  ArrowDown
} from 'lucide-react'

import GhostFibersBackground from '../components/GhostFibersBackground'
import ElectricBorder from '../components/ElectricBorder'

export default function LandingPage() {
  const [isRevealed, setIsRevealed] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) {
      setIsRevealed(true)
      return undefined
    }
    const revealTimer = window.setTimeout(() => setIsRevealed(true), 500)
    return () => window.clearTimeout(revealTimer)
  }, [reduceMotion])

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
    <div className="relative min-h-screen overflow-hidden">
      {!isRevealed && <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#07111f]" role="status"><motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="text-center"><Radio className="mx-auto h-10 w-10 animate-pulse text-cyan-400" /><p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">ReliefGrid network</p></motion.div></div>}
      {/* GhostFibers Interactive Particle & Fiber Canvas */}
      <GhostFibersBackground />

      {/* Hero Section */}
      <section className="relative pt-10 pb-20 md:pt-16 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Floating Humanitarian Micro-Elements (Subtle Parallax Badges) */}
        <div className="hidden xl:block absolute top-20 left-6 pointer-events-none">
          <motion.div
            animate={{ y: [-8, 8, -8], rotate: [-2, 2, -2] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md text-xs text-cyan-300 shadow-xl"
          >
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[11px] text-white">Potable Water Hubs</div>
              <div className="text-[9px] text-slate-400">Puri &amp; Cuttack Sectors</div>
            </div>
          </motion.div>
        </div>

        <div className="hidden xl:block absolute top-28 right-8 pointer-events-none">
          <motion.div
            animate={{ y: [8, -8, 8], rotate: [2, -2, 2] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md text-xs text-red-300 shadow-xl"
          >
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[11px] text-white">Emergency EMT Dispatch</div>
              <div className="text-[9px] text-slate-400">Trauma Units Standby</div>
            </div>
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
            A unified humanitarian crisis coordination engine bridging flood, cyclone, and earthquake victims with accredited NGOs, field volunteers, and supply donors in real time.
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
                  <span>Login to Request Help</span>
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
                <span>Register to Contribute</span>
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

          {/* Quick Awareness Quiz Shortcut */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400"
          >
            <Link
              to="/game"
              className="flex items-center gap-1.5 hover:text-cyan-400 font-medium transition-colors bg-slate-900/60 px-3.5 py-1.5 rounded-full border border-slate-800 hover:border-purple-500/40"
            >
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              <span>Interactive Disaster Awareness &amp; Readiness Quiz</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

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
            {/* 1. People in Need */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="w-full md:w-1/3 p-5 rounded-2xl bg-slate-950/80 border border-red-500/30 text-center relative shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-bold text-white text-sm">People In Need</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Disaster victims broadcast localized SOS with coordinates, needed rations &amp; medical urgency.
              </p>
              <div className="mt-3 inline-block text-[10px] font-mono text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/20">
                Beacon Active
              </div>
            </motion.div>

            {/* Connecting Flow 1 */}
            <div className="flex flex-col items-center justify-center text-cyan-400">
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="hidden md:block"
              >
                <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" />
              </motion.div>
              <ArrowDown className="w-5 h-5 block md:hidden animate-bounce text-cyan-400" />
              <span className="text-[9px] font-mono text-slate-500 uppercase mt-1">Intake</span>
            </div>

            {/* 2. ReliefGrid Central Hub */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-full md:w-1/3 p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-cyan-950/50 border border-cyan-400/40 text-center relative shadow-2xl shadow-cyan-950"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-400 text-cyan-300 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/20">
                <Radio className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <h4 className="font-bold text-white text-base">
                RELIEF<span className="text-cyan-400">GRID</span>
              </h4>
              <p className="text-[11px] text-slate-300 mt-1">
                Intelligent geospatial classification, supply inventory matching, and verified credential dispatch.
              </p>
              <div className="mt-3 inline-block text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                Automated Triage Engine
              </div>
            </motion.div>

            {/* Connecting Flow 2 */}
            <div className="flex flex-col items-center justify-center text-emerald-400">
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.75 }}
                className="hidden md:block"
              >
                <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" />
              </motion.div>
              <ArrowDown className="w-5 h-5 block md:hidden animate-bounce text-emerald-400" />
              <span className="text-[9px] font-mono text-slate-500 uppercase mt-1">Dispatch</span>
            </div>

            {/* 3. NGOs + Volunteers + Donors */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="w-full md:w-1/3 p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-center relative shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-sm">NGOs • Volunteers • Donors</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Mobilized frontline teams arrive with targeted aid, preventing duplication and resource waste.
              </p>
              <div className="mt-3 inline-block text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                Aid Delivered
              </div>
            </motion.div>
          </div>
        </motion.div>

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
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                whileHover={{ y: -6 }}
                className={`p-6 rounded-3xl border backdrop-blur-md ${step.bg} ${step.border} flex flex-col justify-between relative shadow-xl`}
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
              </motion.div>
            )
          })}
        </div>
      </section>

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
