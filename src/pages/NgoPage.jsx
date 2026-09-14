import { useEffect, useState } from 'react'
import { Building2, Loader2 } from 'lucide-react'
import { apiFetch } from '../lib/api'

export default function NgoPage() {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { apiFetch('/ngo/dashboard').then((data) => setDashboard(data.data)).catch((err) => setError(err.message)) }, [])
  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><p className="rounded-xl border border-red-500/30 bg-red-950/50 p-4 text-sm text-red-200">{error}</p></div>
  if (!dashboard) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-cyan-400" />
  return <div className="mx-auto min-h-[calc(100vh-12rem)] max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8"><header><span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Verified organization</span><h1 className="mt-2 flex items-center gap-3 text-3xl font-black text-white"><Building2 className="h-8 w-8 text-emerald-400" />NGO coordination dashboard</h1><p className="mt-2 text-sm text-slate-400">Live request, volunteer, opportunity, and commitment data.</p></header><div className="grid gap-4 sm:grid-cols-4">{[['Requests', dashboard.requests.length], ['Opportunities', dashboard.opportunities.length], ['Commitments', dashboard.commitments.length], ['Applications', dashboard.applications.length]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-3xl font-black text-white">{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p></div>)}</div></div>
}
