import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Radio, Lock, Mail, Eye, EyeOff, LogIn, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submittedMessage, setSubmittedMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmittedMessage('')

    if (!email || !password) {
      setSubmittedMessage('Please enter both email and password.')
      return
    }

    try {
      setLoading(true)

      const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })

      setSubmittedMessage('Login successful. Redirecting...')
      setUser(data.user)

      setTimeout(() => {
        navigate('/home')
      }, 700)
    } catch (error) {
      setSubmittedMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md space-y-6"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Operations Center</span>
        </Link>

        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <motion.div
              whileHover={{ scale: 1.06 }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-cyan-600 p-[1.5px] mx-auto shadow-lg shadow-cyan-950 cursor-pointer"
            >
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
            </motion.div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              ReliefGrid Access
            </h1>

            <p className="text-xs text-slate-400">
              Secure portal for disaster relief responders, verified NGOs, and volunteers.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/20 text-slate-300 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-400">
              <strong className="text-cyan-300">Secure Authentication:</strong> Your session is protected using an HTTP-only authentication cookie.
            </p>
          </div>

          <AnimatePresence>
            {submittedMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2 shadow-md"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>{submittedMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>

              <div className="relative rounded-xl border border-slate-700/80 bg-slate-950/70 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="responder@reliefgrid.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>

                <Link to="/forgot-password" className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>

              <div className="relative rounded-xl border border-slate-700/80 bg-slate-950/70 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-cyan-950 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to Relief Operations'}</span>
            </motion.button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <span>Don&apos;t have an account yet? </span>
            <Link
              to="/register"
              className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Register as Citizen or NGO
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

