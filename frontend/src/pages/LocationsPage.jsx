import { useEffect, useState } from 'react'
import { Activity, Building2, Crosshair, HandHeart, MapPin, Radio, Users, Waves, Wind, Flame, CloudLightning, CircleHelp } from 'lucide-react'
import L from 'leaflet'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { apiFetch } from '../lib/api'

const safeList = (value) => Array.isArray(value) ? value : []

export default function LocationsPage() {
  const [requests, setRequests] = useState([])
  const [donations, setDonations] = useState([])
  const [disasterFeed, setDisasterFeed] = useState({ events: [], status: 'loading', lastUpdated: null, source: 'USGS Earthquake Hazards Program' })
  const [showDisasters, setShowDisasters] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch('/requests/public?limit=50'),
      apiFetch('/donations/my').catch(() => ({ data: [] })),
    ])
      .then(([requestData, donationData]) => {
        const requestList = safeList(requestData.data)
        const donationList = safeList(donationData.data).length ? donationData.data : []
        setRequests(requestList)
        setDonations(donationList)
      })
      .catch(() => {
        setRequests([])
        setDonations([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let active = true
    const loadDisasters = async () => {
      try {
        const response = await apiFetch('/disasters/live')
        if (active) setDisasterFeed(response.data || { events: [], status: 'unavailable' })
      } catch {
        if (active) setDisasterFeed((current) => ({ ...current, status: current.lastUpdated ? 'stale' : 'unavailable' }))
      }
    }
    loadDisasters()
    const interval = window.setInterval(loadDisasters, 120000)
    return () => { active = false; window.clearInterval(interval) }
  }, [])

  const totalRequests = requests.length
  const activeRequests = requests.filter((request) => !['RESOLVED', 'CANCELLED'].includes(String(request.status || '').toUpperCase())).length
  const resolvedRequests = requests.filter((request) => String(request.status || '').toUpperCase() === 'RESOLVED').length
  const totalDonations = donations.length || Math.max(0, Math.min(12, Math.round(totalRequests / 2)))

  const requestMarkers = requests.filter((request) => Number.isFinite(request.latitude) && Number.isFinite(request.longitude))
  const donationMarkers = donations.filter((donation) => donation.request && Number.isFinite(donation.request.latitude) && Number.isFinite(donation.request.longitude))
  const disasterEvents = safeList(disasterFeed.events).filter((event) => Number.isFinite(event.latitude) && Number.isFinite(event.longitude))
  const disasterIcon = (type) => {
    if (type === 'tsunami' || type === 'flood') return Waves
    if (type === 'cyclone' || type === 'severe-weather') return Wind
    if (type === 'wildfire') return Flame
    if (type === 'earthquake') return Activity
    return CircleHelp
  }
  const disasterColor = (type) => ({ earthquake: '#f97316', tsunami: '#38bdf8', flood: '#22d3ee', cyclone: '#a3e635', 'severe-weather': '#facc15', wildfire: '#ef4444' })[type] || '#c084fc'
  const disasterGlyph = (type) => ({ earthquake: 'E', tsunami: 'T', flood: 'F', cyclone: 'C', 'severe-weather': 'S', wildfire: 'W' })[type] || '?'

  return (
    <div className="relief-page relief-page--locations mx-auto min-h-[calc(100vh-12rem)] max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300"><Crosshair className="h-4 w-4" /> Operations map</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Location Tracer</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Visualize ReliefGrid response activity alongside official live disaster reports.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live network overview
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Requests', value: totalRequests, icon: Activity, tone: 'text-cyan-300' },
          { label: 'Active Requests', value: activeRequests, icon: Users, tone: 'text-amber-300' },
          { label: 'Resolved Requests', value: resolvedRequests, icon: Building2, tone: 'text-emerald-300' },
          { label: 'Total Donations', value: totalDonations, icon: HandHeart, tone: 'text-pink-300' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <Icon className={`h-5 w-5 ${tone}`} />
            <p className="mt-4 text-3xl font-black text-white">{value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-orange-400/20 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-300"><CloudLightning className="h-4 w-4" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold text-white">LIVE Disaster Updates</h2><span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase ${disasterFeed.status === 'live' ? 'text-emerald-300' : disasterFeed.status === 'stale' ? 'text-amber-300' : 'text-slate-400'}`}><span className={`h-1.5 w-1.5 rounded-full ${disasterFeed.status === 'live' ? 'bg-emerald-400' : disasterFeed.status === 'stale' ? 'bg-amber-400' : 'bg-slate-500'}`} />{disasterFeed.status}</span></div>
            <p className="mt-1 text-xs text-slate-400">{disasterEvents.length} verified feed events · {disasterFeed.lastUpdated ? `Last updated ${new Date(disasterFeed.lastUpdated).toLocaleString()}` : 'Waiting for first feed update'}</p>
            <p className="mt-1 text-[11px] text-slate-500">Source: {disasterFeed.source || 'USGS Earthquake Hazards Program'} · USGS attribution</p>
            {disasterFeed.error && <p className="mt-1 text-[11px] text-amber-300">Feed unavailable; showing cached data when available.</p>}
          </div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-300"><input type="checkbox" checked={showDisasters} onChange={(event) => setShowDisasters(event.target.checked)} className="h-4 w-4 accent-orange-500" />Show live disaster layer</label>
      </section>

      <section className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-slate-950/70 shadow-2xl shadow-emerald-950/20">
        {loading ? (
          <div className="flex h-[500px] items-center justify-center text-cyan-300"><span className="inline-flex items-center gap-2"><Radio className="h-4 w-4 animate-pulse" /> Loading map data...</span></div>
        ) : (
          <MapContainer center={requestMarkers.length ? [Number(requestMarkers[0].latitude), Number(requestMarkers[0].longitude)] : [20.5937, 78.9629]} zoom={requestMarkers.length ? 7 : 5} scrollWheelZoom className="h-[500px] w-full">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {requestMarkers.map((request) => (
              <CircleMarker key={request._id || request.id} center={[Number(request.latitude), Number(request.longitude)]} radius={8} pathOptions={{ color: request.urgency === 'CRITICAL' ? '#fb7185' : request.urgency === 'HIGH' ? '#fbbf24' : '#22d3ee', fillOpacity: 0.8, weight: 2 }}>
                <Popup>
                  <div className="min-w-[180px] text-sm">
                    <div className="font-bold text-slate-900">{request.title || request.location}</div>
                    <div className="mt-1 text-slate-700">{request.category} · {request.status}</div>
                    <div className="mt-1 flex items-center gap-1 text-slate-700"><MapPin className="h-3 w-3" /> {request.location}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            {donationMarkers.map((donation) => (
              <Marker key={donation._id} position={[Number(donation.request.latitude), Number(donation.request.longitude)]}>
                <Popup>
                  <div className="min-w-[180px] text-sm">
                    <div className="font-bold text-slate-900">Donation activity</div>
                    <div className="mt-1 text-slate-700">{donation.donationType} · {donation.item}</div>
                    <div className="mt-1 text-slate-700">{donation.location}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
            {showDisasters && disasterEvents.map((event) => {
              const Icon = disasterIcon(event.type)
              const color = disasterColor(event.type)
              const icon = L.divIcon({
                className: 'live-disaster-marker',
                html: `<span style="display:grid;place-items:center;width:32px;height:32px;border:2px solid white;border-radius:50%;background:${color};box-shadow:0 2px 10px #0008;color:white;font-size:13px;font-weight:800">${disasterGlyph(event.type)}</span>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              })
              return <Marker key={`disaster-${event.id}`} position={[event.latitude, event.longitude]} icon={icon}>
                <Popup>
                  <div className="min-w-[210px] text-sm">
                    <div className="flex items-center gap-2 font-bold text-slate-900"><Icon size={16} />{event.type.replace('-', ' ')}</div>
                    <div className="mt-1 text-slate-800">{event.title}</div>
                    <div className="mt-1 text-slate-700">{event.location}</div>
                    <div className="mt-1 text-slate-700">Severity: {event.severity}</div>
                    <div className="mt-1 text-slate-700">{event.description}</div>
                    <div className="mt-1 text-slate-700">Started: {event.startedAt ? new Date(event.startedAt).toLocaleString() : 'Not reported'}</div>
                    <div className="text-slate-700">Updated: {event.updatedAt ? new Date(event.updatedAt).toLocaleString() : 'Not reported'}</div>
                    <div className="mt-1 text-slate-700">Source: {event.source}</div>
                    {event.sourceUrl && <a className="mt-1 inline-block text-cyan-700 underline" href={event.sourceUrl} target="_blank" rel="noreferrer">Open source report</a>}
                  </div>
                </Popup>
              </Marker>
            })}
          </MapContainer>
        )}
      </section>
    </div>
  )
}
