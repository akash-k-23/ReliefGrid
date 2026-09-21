import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Gamepad2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Trophy
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'



export default function GamePage() {
  const { user } = useAuth()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [gameFinished, setGameFinished] = useState(false)

  const questions = [
    {
      id: 1,
      scenario: 'Flash Flood Surge',
      question: 'Water levels are rapidly rising outside your home, and an official evacuation alarm sounds. What is your immediate priority?',
      options: [
        'Attempt to drive through submerged roads to reach a distant supermarket',
        'Move to higher ground immediately with an emergency kit, avoiding moving floodwaters and electrical poles',
        'Stay on the ground floor and wait until water enters the living room',
        'Turn on all electrical appliances to keep them warm'
      ],
      correctIndex: 1,
      explanation: 'Moving immediately to higher ground with essential supplies is critical. Driving through just 6 inches of moving water can stall a vehicle, and 12 inches can sweep it away.',
    },
    {
      id: 2,
      scenario: 'Earthquake Protocol',
      question: 'During severe ground tremors inside a concrete structure, what is the globally recognized life-safety response?',
      options: [
        'Run immediately into the building elevators',
        'Stand in the center of the room with arms raised',
        'Drop, Cover, and Hold On beneath a sturdy desk or interior wall away from glass',
        'Sprint outdoors through crowded stairwells while shaking occurs'
      ],
      correctIndex: 2,
      explanation: '"Drop, Cover, and Hold On" shields your vital organs from falling masonry, ceiling tiles, and shattered glass—the leading cause of earthquake casualties.',
    },
    {
      id: 3,
      scenario: 'Emergency Medical Triage',
      question: 'You encounter a victim with severe bleeding at a relief camp. What is the most effective immediate first aid measure before paramedics arrive?',
      options: [
        'Apply firm, continuous direct pressure over the wound using a clean cloth or sterile dressing',
        'Wash the wound with tap water for 20 minutes without touching it',
        'Give the victim solid heavy food to restore blood loss',
        'Leave the wound exposed to open air to dry out'
      ],
      correctIndex: 0,
      explanation: 'Firm direct pressure stops arterial and venous hemorrhage, preventing hypovolemic shock until professional trauma personnel can intervene.',
    },
    {
      id: 4,
      scenario: 'Potable Water Purification',
      question: 'Municipal water lines are compromised by flood silt. Which method safely renders collected water potable during disaster displacement?',
      options: [
        'Filtering once through a standard cotton cloth only',
        'Vigorous rolling boil for at least 1 minute or using approved water purification chlorine tablets',
        'Adding table salt to kill microbial pathogens',
        'Leaving the water container in ambient sunlight for 10 minutes'
      ],
      correctIndex: 1,
      explanation: 'Rolling boil kills pathogenic bacteria, enteric viruses, and protozoa. Approved chemical chlorine tablets provide disinfection when boiling fuel is unavailable.',
    },
    {
      id: 5,
      scenario: 'ReliefGrid Coordination',
      question: 'When submitting an emergency SOS ticket on ReliefGrid, which information is most vital for volunteer rescue teams?',
      options: [
        'Exact pinpoint coordinates, number of vulnerable persons (infants/elderly), and specific urgent needs',
        'Only your email address without specifying the crisis type',
        'A generic message stating "Help needed somewhere"',
        'An estimated guess of weather next month'
      ],
      correctIndex: 0,
      explanation: 'Precise coordinates, demographics of at-risk individuals, and specific emergency categories (e.g. insulin, rescue boats, baby formula) enable targeted triage dispatch.',
    },
  ]

  const currentQ = questions[currentIdx]

  const handleSelect = (idx) => {
    if (isAnswered) return
    setSelectedOption(idx)
    setIsAnswered(true)

    if (idx === currentQ.correctIndex) {
      setScore((prev) => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1)
      setSelectedOption(null)
      setIsAnswered(false)
    } else {
      setGameFinished(true)
    }
  }

  const handleRestart = () => {
    setCurrentIdx(0)
    setSelectedOption(null)
    setIsAnswered(false)
    setScore(0)
    setGameFinished(false)
  }

  const progressPercent = ((currentIdx + (isAnswered ? 1 : 0)) / questions.length) * 100

  return (
    <div className="relief-page relief-page--game min-h-[calc(100vh-12rem)] py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-800 text-purple-300 text-xs font-semibold"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Interactive Community Awareness Module</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight"
        >
          Disaster Preparedness Challenge
        </motion.h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Learn life-saving protocols and emergency decision-making through rapid scenario challenges.
        </p>
      </div>

      {/* Progress Bar with animated fill */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Challenge {Math.min(currentIdx + 1, questions.length)} of {questions.length}</span>
          <motion.span
            key={score}
            initial={{ scale: 1.2, color: '#a855f7' }}
            animate={{ scale: 1, color: '#c084fc' }}
            className="font-bold"
          >
            Score: {score} Points
          </motion.span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 rounded-full"
          />
        </div>
      </div>

      {/* Game Card */}
      <AnimatePresence mode="wait">
        {gameFinished ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="relative rounded-3xl bg-slate-900/90 border border-purple-500/40 p-8 sm:p-10 backdrop-blur-xl text-center space-y-6 shadow-2xl"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              className="w-18 h-18 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border border-purple-400/50 text-purple-300 flex items-center justify-center mx-auto shadow-2xl shadow-purple-950 p-4"
            >
              <Trophy className="w-10 h-10 text-amber-400" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Challenge Completed!
              </h2>
              <p className="text-sm text-slate-300">
                You scored <strong className="text-cyan-400 text-lg font-bold">{score}</strong> out of <strong className="text-white text-lg font-bold">{questions.length}</strong> points!
              </p>
              <div className="inline-block mt-2 px-4 py-1.5 rounded-full bg-slate-950 border border-purple-500/40 text-xs font-bold text-purple-300 shadow-inner">
                {score === 5
                  ? '⭐ Certified Disaster Readiness Champion'
                  : score >= 3
                  ? '🛡️ Community First Responder Tier'
                  : '📖 Disaster Awareness Novice — Review Guidelines'}
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              In real disaster triage, rapid awareness saves lives. Put this knowledge to work by joining our active responder pool or volunteering for localized support.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Retry Challenge</span>
              </motion.button>

              <Link to="/volunteer">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-lg shadow-emerald-950"
                >
                  Enlist as Volunteer
                </motion.div>
              </Link>

              <Link to={user ? '/home' : '/'}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-colors shadow-lg shadow-cyan-950"
                >
                  Back to Operations Center
                </motion.div>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
            className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-2xl"
          >
            {/* Scenario Tag & Question */}
            <div>
              <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 border border-purple-800 text-purple-300 mb-3">
                Scenario: {currentQ.scenario}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* Answer Options with shake animation on incorrect */}
            <div className="space-y-3">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx
                const isCorrect = idx === currentQ.correctIndex

                let btnBorder = 'border-slate-800 bg-slate-950/70 text-slate-300'
                let shakeAnim = {}

                if (isAnswered) {
                  if (isCorrect) {
                    btnBorder = 'border-emerald-500/80 bg-emerald-950/50 text-emerald-200 ring-2 ring-emerald-500/30'
                  } else if (isSelected && !isCorrect) {
                    btnBorder = 'border-red-500/80 bg-red-950/50 text-red-200 ring-2 ring-red-500/30'
                    shakeAnim = { x: [-8, 8, -6, 6, -3, 3, 0] }
                  } else {
                    btnBorder = 'border-slate-800/40 bg-slate-950/30 text-slate-500 opacity-50'
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    type="button"
                    disabled={isAnswered}
                    animate={shakeAnim}
                    whileHover={!isAnswered ? { scale: 1.015, x: 4 } : {}}
                    whileTap={!isAnswered ? { scale: 0.99 } : {}}
                    onClick={() => handleSelect(idx)}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${btnBorder}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 pt-0.5">{option}</span>
                    {isAnswered && isCorrect && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      </motion.div>
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Feedback & Explanation Accordion */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 overflow-hidden shadow-inner"
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span className={selectedOption === currentQ.correctIndex ? 'text-emerald-400' : 'text-red-400'}>
                      {selectedOption === currentQ.correctIndex ? 'Correct Decision!' : 'Important Protocol Rule:'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentQ.explanation}
                  </p>

                  <div className="pt-3 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleNext}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950 transition-all"
                    >
                      <span>{currentIdx + 1 < questions.length ? 'Next Scenario' : 'View Results'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
