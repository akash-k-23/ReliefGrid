import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { apiFetch } from '../lib/api'

export default function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const tokenFromUrl = new URLSearchParams(location.search).get('token') || ''
  const [token, setToken] = useState(tokenFromUrl)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const data = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setMessage(data.message)
      setTimeout(() => navigate('/login'), 700)
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
            <KeyRound className="h-7 w-7 text-cyan-400" />
            <h1 className="mt-3 text-2xl font-extrabold text-white">Choose a new password</h1>
            <p className="mt-2 text-sm text-slate-400">Use the reset token before its 15-minute expiration.</p>
          </div>
          {message && <p className="rounded-xl border border-cyan-500/30 bg-cyan-950/50 p-3 text-xs text-cyan-200">{message}</p>}
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-xs font-semibold text-slate-300">Reset token<input required value={token} onChange={(event) => setToken(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-cyan-400" /></label>
            <label className="block text-xs font-semibold text-slate-300">New password<input type="password" required minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400" /></label>
            <label className="block text-xs font-semibold text-slate-300">Confirm password<input type="password" required minLength="8" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400" /></label>
            <button disabled={loading} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? 'Updating...' : 'Set new password'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
