import { useEffect, useState } from 'react'
import { CheckCircle2, HandHeart, Loader2, Search } from 'lucide-react'
import { apiFetch } from '../lib/api'
import ImpactDashboard from '../components/ImpactDashboard'

const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-400'

export default function DonatePage() {
  const requestIdFromUrl = new URLSearchParams(window.location.search).get('requestId')
  const [requests, setRequests] = useState([])
  const [history, setHistory] = useState([])
  const [query, setQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState('')
  const [form, setForm] = useState({ donationType: 'FOOD', item: '', quantity: '', amount: 0, location: '', message: '', volunteerNeeded: 'NO' })
  const [locationMatches, setLocationMatches] = useState([])
  const [findingLocation, setFindingLocation] = useState(false)
  const [state, setState] = useState({ loading: true, submitting: false, message: '', error: '' })

  const load = async () => {
    try {
      const [requestData, historyData] = await Promise.all([
        apiFetch(`/requests/public?status=PENDING&search=${encodeURIComponent(query)}&limit=50`),
        apiFetch('/donations/my'),
      ])
      setRequests(requestData.data || [])
      setHistory(historyData.data || [])
      if (requestIdFromUrl && requestData.data?.some((request) => request._id === requestIdFromUrl)) setSelectedRequest(requestIdFromUrl)
    } catch (error) {
      setRequests([])
      setState((current) => ({ ...current, error: error.message }))
    } finally {
      setState((current) => ({ ...current, loading: false }))
    }
  }

  useEffect(() => { load() }, [])
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const findLocations = async () => {
    const search = form.location.trim()
    if (!search) return
    setFindingLocation(true)
    setState((current) => ({ ...current, error: '' }))
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(search)}`)
      if (!response.ok) throw new Error('Location search is temporarily unavailable.')
      const results = await response.json()
      setLocationMatches(Array.isArray(results) ? results : [])
      if (!results.length) setState((current) => ({ ...current, error: 'No matching place found. Try a more specific address or use Google Maps.' }))
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    } finally {
      setFindingLocation(false)
    }
  }
  const selectedAlreadyCommitted = history.some((item) => item.request?._id === selectedRequest && item.status !== 'CANCELLED')
  const submit = async (event) => {
    event.preventDefault()
    if (selectedAlreadyCommitted) {
      setState({ loading: false, submitting: false, message: 'You already have an active commitment for this request.', error: '' })
      return
    }
    setState({ loading: false, submitting: true, message: '', error: '' })
    try {
      await apiFetch('/donations', { method: 'POST', body: JSON.stringify({ ...form, requestId: selectedRequest, amount: Number(form.amount), volunteerNeeded: form.volunteerNeeded === 'YES' }) })
      setForm({ ...form, item: '', quantity: '', message: '', volunteerNeeded: 'NO' })
      setState({ loading: false, submitting: false, message: 'Support commitment recorded.', error: '' })
      load()
    } catch (error) {
      setState({ loading: false, submitting: false, message: '', error: error.message })
    }
  }

  return (
    <div className="relief-page relief-page--donate mx-auto min-h-[calc(100vh-12rem)] max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header><span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Support the response</span><h1 className="mt-2 text-3xl font-black text-white">Commit support to an active request</h1><p className="mt-2 text-sm text-slate-400">This records an offline contribution commitment, not a payment transaction.</p></header>
      <ImpactDashboard showEmergency={false} showLeaderboard />
      {state.message && <p className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/50 p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />{state.message}</p>}
      {state.error && <p className="rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-200">{state.error}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center gap-2"><Search className="h-4 w-4 text-cyan-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && load()} placeholder="Search active requests" className={inputClass} /></div>
          {state.loading ? <Loader2 className="h-5 w-5 animate-spin text-cyan-400" /> : requests.length === 0 ? <p className="text-sm text-slate-400">No active requests match your search.</p> : <div className="space-y-3">{requests.map((request) => <button type="button" key={request._id} onClick={() => setSelectedRequest(request._id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedRequest === request._id ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-800 bg-slate-950/70 hover:border-slate-600'}`}><div className="flex justify-between gap-3"><strong className="text-sm text-white">{request.title}</strong><span className="text-[10px] font-bold text-red-400">{request.urgency}</span></div><p className="mt-2 text-xs text-slate-400">{request.location} · {request.category}</p><p className="mt-2 text-xs text-slate-500">{request.description}</p></button>)}</div>}
        </section>
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6"><div className="flex items-center gap-2 text-lg font-bold text-white"><HandHeart className="h-5 w-5 text-cyan-400" />Commitment details</div><select className={inputClass} value={selectedRequest} onChange={(event) => setSelectedRequest(event.target.value)} required><option value="">Select a request</option>{requests.map((request) => { const alreadyCommitted = history.some((item) => item.request?._id === request._id && item.status !== 'CANCELLED'); return <option key={request._id} value={request._id} disabled={alreadyCommitted}>{alreadyCommitted ? `${request.title} (already supported)` : request.title}</option> })}</select>{selectedAlreadyCommitted && <p className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-200">You already have an active commitment for this request. Choose another request to add support.</p>}<label className="block text-xs font-semibold text-slate-300">Support type<select className={inputClass} name="donationType" value={form.donationType} onChange={update}>{['MONEY','FOOD','CLOTHING','MEDICAL','OTHER'].map((type) => <option key={type}>{type}</option>)}</select></label><input className={inputClass} name="item" value={form.item} onChange={update} required placeholder="Item or purpose" /><input className={inputClass} name="quantity" value={form.quantity} onChange={update} required placeholder="Quantity or amount" /><div className="space-y-2"><label className="block text-xs font-semibold text-slate-300">Fulfillment location<input className={inputClass} name="location" value={form.location} onChange={update} required placeholder="Search or enter a location" /></label><div className="flex flex-wrap items-center gap-4"><button type="button" disabled={findingLocation || !form.location.trim()} onClick={findLocations} className="text-xs font-semibold text-cyan-300 underline underline-offset-2 disabled:opacity-50">{findingLocation ? 'Searching…' : 'Search locations'}</button><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location || 'India')}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-cyan-300 underline underline-offset-2">Choose on Google Maps</a></div>{locationMatches.length > 0 && <ul className="divide-y divide-slate-800 border border-slate-700" aria-label="Location search results">{locationMatches.map((result) => <li key={result.place_id}><button type="button" onClick={() => { setForm((current) => ({ ...current, location: result.display_name })); setLocationMatches([]) }} className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-800">{result.display_name}</button></li>)}</ul>}</div><label className="block text-xs font-semibold text-slate-300">Volunteer support needed?<select className={inputClass} name="volunteerNeeded" value={form.volunteerNeeded} onChange={update}><option value="NO">No</option><option value="YES">Yes, add this to Volunteer opportunities</option></select></label><textarea className={inputClass} name="message" value={form.message} onChange={update} placeholder="Message (optional)" rows="3" /><button disabled={state.submitting || selectedAlreadyCommitted} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white disabled:opacity-60">{state.submitting && <Loader2 className="h-4 w-4 animate-spin" />}Record commitment</button></form>
      </div>
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6"><h2 className="mb-4 text-lg font-bold text-white">My support history</h2>{history.length === 0 ? <p className="text-sm text-slate-400">No commitments recorded yet.</p> : <div className="space-y-3">{history.map((item) => { const volunteer = item.volunteerOpportunity?.joinedVolunteers?.[0]; return <div key={item._id} className="border-b border-slate-800 pb-3"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="text-slate-300">{item.request?.title || item.item}</span><span className="text-xs font-bold uppercase text-cyan-300">{item.status}</span></div><div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500"><span>{item.item} · {item.quantity}</span>{volunteer ? <span>Volunteer: {volunteer.name} · {volunteer.phone} · {volunteer.location}</span> : item.volunteerNeeded ? <span>Waiting for a volunteer</span> : null}</div></div> })}</div>}</section>
    </div>
  )
}
