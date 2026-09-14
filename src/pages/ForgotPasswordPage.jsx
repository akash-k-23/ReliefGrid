import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Send } from 'lucide-react'
import { apiFetch } from '../lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setMessage(data.message)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Reset your password</h1>
            <p className="mt-2 text-sm text-slate-400">Enter your account email to request a time-limited reset token.</p>
          </div>
          {message && <p className="rounded-xl border border-cyan-500/30 bg-cyan-950/50 p-3 text-xs text-cyan-200">{message}</p>}
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-xs font-semibold text-slate-300">
              Email address
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-400" />
              </div>
            </label>
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white disabled:opacity-60">
              <Send className="h-4 w-4" />
              {loading ? 'Requesting...' : 'Request reset token'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
