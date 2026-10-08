import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ExternalLink, HandHeart, Loader2, MapPin, ShieldCheck, Users } from 'lucide-react'
import { apiFetch } from '../lib/api'

export default function EmergencyRequestPage() {
  const { id } = useParams()
  const [request, setRequest] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('MISINFORMATION')
  const [reportDetails, setReportDetails] = useState('')
  const [state, setState] = useState({ loading: true, saving: false, message: '', error: '' })

  useEffect(() => {
    let active = true
    apiFetch(`/requests/${id}`)
      .then((result) => { if (active) setRequest(result.data) })
      .catch((error) => { if (active) setState((current) => ({ ...current, error: error.message })) })
      .finally(() => { if (active) setState((current) => ({ ...current, loading: false })) })
    return () => { active = false }
  }, [id])

  const respond = async (response) => {
    setState((current) => ({ ...current, saving: true, message: '', error: '' }))
    try {
      const result = await apiFetch(`/emergency/requests/${id}/respond`, { method: 'POST', body: JSON.stringify({ response }) })
      setState((current) => ({ ...current, message: result.message }))
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    } finally {
      setState((current) => ({ ...current, saving: false }))
    }
  }

  const submitReport = async (event) => {
    event.preventDefault()
    setState((current) => ({ ...current, saving: true, message: '', error: '' }))
    try {
      const result = await apiFetch('/emergency/reports', { method: 'POST', body: JSON.stringify({ targetType: 'REQUEST', targetId: id, reason: reportReason, details: reportDetails }) })
      setReportOpen(false)
      setReportDetails('')
      setState((current) => ({ ...current, message: result.message }))
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    } finally {
      setState((current) => ({ ...current, saving: false }))
    }
  }

  if (state.loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-cyan-200" /></div>
  if (!request) return <div className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-100">{state.error || 'Request not found.'}</p><Link to="/home" className="mt-4 inline-block text-sm text-cyan-200 underline">Return to dashboard</Link></div>

  const hasCoordinates = Number.isFinite(request.latitude) && Number.isFinite(request.longitude)
  const mapUrl = hasCoordinates ? `https://www.openstreetmap.org/?mlat=${request.latitude}&mlon=${request.longitude}#map=14/${request.latitude}/${request.longitude}` : `https://www.openstreetmap.org/search?query=${encodeURIComponent(request.location)}`
  const isClosed = ['RESOLVED', 'CANCELLED'].includes(request.status)

  return <main className="mx-auto min-h-[calc(100vh-12rem)] w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <Link to="/home" className="text-xs font-semibold text-cyan-200 underline">Back to dashboard</Link>
    <header className="border-b border-slate-700 pb-5"><div className="flex flex-wrap items-center gap-2"><span className={`border px-2 py-1 text-[10px] font-bold uppercase ${request.urgency === 'CRITICAL' ? 'border-red-300/40 bg-red-950/40 text-red-200' : 'border-amber-300/30 text-amber-100'}`}>{request.urgency} urgency</span><span className="text-xs text-slate-400">{request.status}</span></div><h1 className="mt-3 text-2xl font-black text-white">{request.title}</h1><p className="mt-2 text-xs text-slate-400">{request.disasterType} · {request.category} · {new Date(request.createdAt).toLocaleString()}</p></header>
    {state.message && <p role="status" className="flex gap-2 border border-emerald-400/30 bg-emerald-950/30 p-3 text-sm text-emerald-100"><CheckCircle2 className="h-4 w-4" />{state.message}</p>}
    {state.error && <p role="alert" className="flex gap-2 border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-100"><AlertTriangle className="h-4 w-4" />{state.error}</p>}
    <section className="border-b border-slate-800 pb-4"><button type="button" onClick={() => setReportOpen((open) => !open)} className="text-xs font-semibold text-slate-400 underline">Report this request</button>{reportOpen && <form onSubmit={submitReport} className="mt-3 grid gap-3 sm:grid-cols-[12rem_1fr_auto]"><select value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"><option value="MISINFORMATION">Misinformation</option><option value="SPAM">Spam</option><option value="ABUSE">Abuse</option><option value="PRIVACY">Privacy concern</option><option value="OTHER">Other</option></select><input maxLength={1000} value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} placeholder="Optional details" className="border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /><button disabled={state.saving} className="min-h-9 bg-red-800 px-4 text-xs font-bold text-white disabled:opacity-50">Submit report</button></form>}</section>
    <section className="grid gap-5 md:grid-cols-[1fr_18rem]"><div className="space-y-5"><article className="border border-slate-700 bg-slate-950/60 p-5"><h2 className="text-sm font-bold text-white">Situation</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{request.description}</p>{request.requiredResources && <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-400">Needed: {request.requiredResources}</p>}</article><article className="border border-slate-700 bg-slate-950/60 p-5"><h2 className="flex items-center gap-2 text-sm font-bold text-white"><MapPin className="h-4 w-4 text-cyan-200" />Location</h2><p className="mt-2 text-sm text-slate-300">{request.location}</p><a href={mapUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-cyan-200 underline"><ExternalLink className="h-3.5 w-3.5" />Open map</a></article></div>
      <aside className="h-fit border border-slate-700 bg-slate-950/60 p-5"><h2 className="text-sm font-bold text-white">Respond</h2>{isClosed ? <p className="mt-3 text-xs text-slate-400">This request is {request.status.toLowerCase()} and is no longer accepting responses.</p> : <><p className="mt-2 text-xs leading-5 text-slate-400">Record your response without creating a duplicate contribution.</p><button disabled={state.saving} onClick={() => respond('ACCEPTED')} className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 bg-emerald-700 px-3 text-xs font-bold text-white disabled:opacity-50"><ShieldCheck className="h-4 w-4" />I can help</button><button disabled={state.saving} onClick={() => respond('DECLINED')} className="mt-2 min-h-10 w-full border border-slate-700 px-3 text-xs font-semibold text-slate-300 disabled:opacity-50">Decline this alert</button><div className="mt-5 border-t border-slate-800 pt-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Use an existing workflow</p><Link to={`/donate?requestId=${request._id}`} className="mt-3 flex items-center gap-2 text-xs font-semibold text-cyan-200 underline"><HandHeart className="h-4 w-4" />Pledge supplies or support</Link><Link to={`/volunteer?requestId=${request._id}`} className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-200 underline"><Users className="h-4 w-4" />Find volunteer work</Link></div></>}</aside></section>
  </main>
}
