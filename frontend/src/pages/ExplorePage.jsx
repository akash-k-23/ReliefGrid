import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, MapPin, Users } from 'lucide-react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { apiFetch } from '../lib/api'
import { demoOpportunities, demoRequests } from '../data/reliefGridDemoData'

export default function ExplorePage() {
  const [requests, setRequests] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([apiFetch('/requests/public?status=PENDING'), apiFetch('/opportunities')])
      .then(([requestData, opportunityData]) => { setRequests(requestData.data?.length ? requestData.data : demoRequests); setOpportunities(opportunityData.data?.length ? opportunityData.data : demoOpportunities) })
      .catch((err) => { setError(err.message); setRequests(demoRequests); setOpportunities(demoOpportunities) })
      .finally(() => setLoading(false))
  }, [])

  const matches = (item) => `${item.title} ${item.description} ${item.location}`.toLowerCase().includes(query.toLowerCase())
  const visibleRequests = requests.filter(matches)
  const visibleOpportunities = opportunities.filter(matches)
  const mappedRequests = visibleRequests.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))

  return <div className="relief-page relief-page--explore mx-auto min-h-[calc(100vh-12rem)] max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Live coordination data</span><h1 className="mt-2 text-3xl font-black text-white">Explore the relief grid</h1><p className="mt-2 text-sm text-slate-400">Browse active needs and open volunteer assignments.</p></div><input aria-label="Search relief requests and opportunities" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search location or need" className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 md:w-72" /></header>
    {error && <p className="rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
    {loading ? <Loader2 className="h-6 w-6 animate-spin text-cyan-400" /> : <>
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-3"><h2 className="px-3 py-3 text-lg font-bold text-white">Request map</h2>{mappedRequests.length ? <MapContainer center={[mappedRequests[0].latitude, mappedRequests[0].longitude]} zoom={6} className="h-80 w-full rounded-2xl"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{mappedRequests.map((item) => <Marker key={item._id} position={[item.latitude, item.longitude]}><Popup><strong>{item.title}</strong><br />{item.location}</Popup></Marker>)}</MapContainer> : <p className="p-4 text-sm text-slate-400">No exact coordinates are available. The accessible request list below remains the source of truth.</p>}</section>
      <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white"><AlertTriangle className="h-5 w-5 text-red-400" />Active needs</h2><div className="space-y-3">{visibleRequests.map((item) => <article key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex justify-between gap-3"><h3 className="font-semibold text-white">{item.title}</h3><span className="text-xs font-bold text-red-400">{item.urgency}</span></div><p className="mt-2 text-xs text-slate-400">{item.description}</p><p className="mt-3 flex gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{item.location} · {item.category}</p></article>)}{visibleRequests.length === 0 && <p className="text-sm text-slate-400">No matching active needs.</p>}</div></section><section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white"><Users className="h-5 w-5 text-emerald-400" />Volunteer assignments</h2><div className="space-y-3">{visibleOpportunities.map((item) => <article key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><h3 className="font-semibold text-white">{item.title}</h3><p className="mt-2 text-xs text-slate-400">{item.location} · {item.category}</p><p className="mt-2 text-xs text-slate-500">{item.joinedVolunteers?.length || 0} of {item.requiredVolunteers} volunteers joined</p></article>)}{visibleOpportunities.length === 0 && <p className="text-sm text-slate-400">No matching assignments.</p>}</div></section></div>
    </>}
  </div>
}
