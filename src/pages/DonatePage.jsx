import { useEffect, useState } from 'react'
import { CheckCircle2, HandHeart, Loader2, Search } from 'lucide-react'
import { apiFetch } from '../lib/api'

const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-400'

export default function DonatePage() {
  const [requests, setRequests] = useState([])
  const [history, setHistory] = useState([])
  const [query, setQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState('')
  const [form, setForm] = useState({ donationType: 'FOOD', item: '', quantity: '', amount: 0, location: '', message: '' })
  const [state, setState] = useState({ loading: true, submitting: false, message: '', error: '' })

  const load = async () => {
    try {
      const [requestData, historyData] = await Promise.all([
        apiFetch(`/requests/public?status=PENDING&search=${encodeURIComponent(query)}&limit=50`),
        apiFetch('/donations/my'),
      ])
      setRequests(requestData.data)
      setHistory(historyData.data)
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    } finally {
      setState((current) => ({ ...current, loading: false }))
    }
  }

  useEffect(() => { load() }, [])
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    setState({ loading: false, submitting: true, message: '', error: '' })
    try {
      await apiFetch('/donations', { method: 'POST', body: JSON.stringify({ ...form, requestId: selectedRequest, amount: Number(form.amount) }) })
      setForm({ ...form, item: '', quantity: '', message: '' })
      setState({ loading: false, submitting: false, message: 'Support commitment recorded.', error: '' })
      load()
    } catch (error) {
      setState({ loading: false, submitting: false, message: '', error: error.message })
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-12rem)] max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header><span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Support the response</span><h1 className="mt-2 text-3xl font-black text-white">Commit support to an active request</h1><p className="mt-2 text-sm text-slate-400">This records an offline contribution commitment, not a payment transaction.</p></header>
      {state.message && <p className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/50 p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />{state.message}</p>}
      {state.error && <p className="rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-200">{state.error}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center gap-2"><Search className="h-4 w-4 text-cyan-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && load()} placeholder="Search active requests" className={inputClass} /></div>
          {state.loading ? <Loader2 className="h-5 w-5 animate-spin text-cyan-400" /> : requests.length === 0 ? <p className="text-sm text-slate-400">No active requests match your search.</p> : <div className="space-y-3">{requests.map((request) => <button type="button" key={request._id} onClick={() => setSelectedRequest(request._id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedRequest === request._id ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-800 bg-slate-950/70 hover:border-slate-600'}`}><div className="flex justify-between gap-3"><strong className="text-sm text-white">{request.title}</strong><span className="text-[10px] font-bold text-red-400">{request.urgency}</span></div><p className="mt-2 text-xs text-slate-400">{request.location} · {request.category}</p><p className="mt-2 text-xs text-slate-500">{request.description}</p></button>)}</div>}
        </section>
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6"><div className="flex items-center gap-2 text-lg font-bold text-white"><HandHeart className="h-5 w-5 text-cyan-400" />Commitment details</div><select className={inputClass} value={selectedRequest} onChange={(event) => setSelectedRequest(event.target.value)} required><option value="">Select a request</option>{requests.map((request) => <option key={request._id} value={request._id}>{request.title}</option>)}</select><label className="block text-xs font-semibold text-slate-300">Support type<select className={inputClass} name="donationType" value={form.donationType} onChange={update}>{['MONEY','FOOD','CLOTHING','MEDICAL','OTHER'].map((type) => <option key={type}>{type}</option>)}</select></label><input className={inputClass} name="item" value={form.item} onChange={update} required placeholder="Item or purpose" /><input className={inputClass} name="quantity" value={form.quantity} onChange={update} required placeholder="Quantity or amount" /><input className={inputClass} name="location" value={form.location} onChange={update} required placeholder="Fulfillment location" /><textarea className={inputClass} name="message" value={form.message} onChange={update} placeholder="Message (optional)" rows="3" /><button disabled={state.submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white disabled:opacity-60">{state.submitting && <Loader2 className="h-4 w-4 animate-spin" />}Record commitment</button></form>
      </div>
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6"><h2 className="mb-4 text-lg font-bold text-white">My support history</h2>{history.length === 0 ? <p className="text-sm text-slate-400">No commitments recorded yet.</p> : <div className="space-y-2">{history.map((item) => <div key={item._id} className="flex flex-wrap justify-between gap-2 border-b border-slate-800 py-3 text-sm"><span className="text-slate-300">{item.request?.title || item.item}</span><span className="text-xs font-bold text-cyan-300">{item.status}</span></div>)}</div>}</section>
    </div>
  )
}
