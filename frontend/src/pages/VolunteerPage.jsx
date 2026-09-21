import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, Loader2, MapPin, Users } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { demoOpportunities } from '../data/reliefGridDemoData'

export default function VolunteerPage() {
  const [items, setItems] = useState([])
  const [applications, setApplications] = useState([])
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = () => Promise.all([apiFetch('/opportunities'), apiFetch('/opportunities/applications/my')]).then(([opportunities, applicationData]) => { setItems(opportunities.data?.length ? opportunities.data : demoOpportunities); setApplications(applicationData.data || []) }).catch((err) => { setError(err.message); setItems(demoOpportunities) })
  useEffect(() => { load() }, [])

  const apply = async (id) => {
    setBusy(id)
    setError('')
    try {
      const data = await apiFetch(`/opportunities/${id}/apply`, { method: 'POST', body: JSON.stringify({ skills: [], availability: 'Not specified' }) })
      setMessage(data.message)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return <div className="relief-page relief-page--volunteer mx-auto min-h-[calc(100vh-12rem)] max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
    <header><span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Field mobilization</span><h1 className="mt-2 text-3xl font-black text-white">Volunteer opportunities</h1><p className="mt-2 text-sm text-slate-400">Apply for a real response assignment and help organizations staff relief operations.</p></header>
    {message && <p className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/50 p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />{message}</p>}
    {error && <p className="rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => { const application = applications.find((entry) => entry.opportunity?._id === item._id); return <article key={item._id} className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5 shadow-xl"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-white">{item.title}</h2><span className="text-[10px] font-bold text-emerald-400">{item.status}</span></div><p className="mt-3 text-sm leading-relaxed text-slate-400">{item.description}</p><div className="mt-4 space-y-2 text-xs text-slate-400"><p className="flex gap-2"><MapPin className="h-4 w-4 text-cyan-400" />{item.location}</p><p className="flex gap-2"><CalendarDays className="h-4 w-4 text-cyan-400" />{new Date(item.date).toLocaleDateString()}</p><p className="flex gap-2"><Users className="h-4 w-4 text-cyan-400" />{item.joinedVolunteers?.length || 0} / {item.requiredVolunteers} joined</p></div><button disabled={Boolean(busy) || Boolean(application)} onClick={() => apply(item._id)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : application ? `Application ${application.status.toLowerCase()}` : 'Apply for opportunity'}</button></article> })}</div>
  </div>
}
