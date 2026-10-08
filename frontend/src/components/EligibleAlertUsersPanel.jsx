import { useEffect, useState } from 'react'
import { Loader2, MapPin, Users } from 'lucide-react'
import { apiFetch } from '../lib/api'

export default function EligibleAlertUsersPanel() {
  const [requests, setRequests] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [eligible, setEligible] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })

  useEffect(() => {
    apiFetch('/admin/requests')
      .then((result) => setRequests((result.data || []).filter((request) => ['HIGH', 'CRITICAL'].includes(request.urgency) && !['RESOLVED', 'CANCELLED'].includes(request.status))))
      .catch((error) => setState((current) => ({ ...current, error: error.message })))
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }, [])

  const selectRequest = async (requestId) => {
    setSelectedId(requestId)
    setEligible([])
    if (!requestId) return
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const result = await apiFetch(`/admin/emergency-eligible-users?requestId=${encodeURIComponent(requestId)}`)
      setEligible(result.data.users || [])
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    } finally {
      setState((current) => ({ ...current, loading: false }))
    }
  }

  return <section className="mx-auto w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8" aria-labelledby="eligible-alert-users-heading">
    <div className="border-t border-slate-700 pt-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Consent and coverage</p><h2 id="eligible-alert-users-heading" className="mt-1 flex items-center gap-2 text-xl font-bold text-white"><Users className="h-5 w-5" />Eligible emergency recipients</h2><p className="mt-1 text-xs text-slate-400">Only opted-in, phone-verified users within their selected radius and emergency types are shown. Phone numbers and precise locations are not displayed.</p></div>
    {state.error && <p role="alert" className="border border-red-400/30 bg-red-950/30 p-3 text-xs text-red-100">{state.error}</p>}
    <label className="block max-w-xl text-xs font-semibold text-slate-300">Urgent request<select value={selectedId} onChange={(event) => selectRequest(event.target.value)} className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="">Select an active urgent request</option>{requests.map((request) => <option key={request._id} value={request._id}>{request.title} · {request.urgency} · {request.location}</option>)}</select></label>
    {state.loading ? <Loader2 className="h-5 w-5 animate-spin text-cyan-200" aria-label="Loading eligible recipients" /> : selectedId && <div className="divide-y divide-slate-800 border-y border-slate-800">{eligible.map((user) => <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold text-white">{user.name}</p><p className="text-[11px] text-slate-400">{user.role} · opted radius {user.radiusKm} km</p></div><span className="flex items-center gap-1 text-xs text-cyan-100"><MapPin className="h-3.5 w-3.5" />{user.approximateDistanceKm} km away</span></div>)}{eligible.length === 0 && <p className="py-4 text-xs text-slate-500">No opted-in recipients match this request.</p>}</div>}
  </section>
}
