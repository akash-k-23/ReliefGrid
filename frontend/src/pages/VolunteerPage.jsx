import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, ExternalLink, Loader2, MapPin, Navigation, Users } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const validPoint = (latitude, longitude) => Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))

function AssignmentMap({ assignment, homeLocation }) {
  const [origin, setOrigin] = useState(null)
  const [route, setRoute] = useState([])
  const [mapError, setMapError] = useState('')
  const request = assignment.opportunity?.sourceRequest
  const destinationLatitude = Number(request?.latitude)
  const destinationLongitude = Number(request?.longitude)
  const destination = validPoint(destinationLatitude, destinationLongitude) ? [destinationLatitude, destinationLongitude] : null

  useEffect(() => {
    if (!homeLocation || !validPoint(destinationLatitude, destinationLongitude)) return undefined
    const routeDestination = [destinationLatitude, destinationLongitude]
    const loadRoute = async () => {
      try {
        const geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(homeLocation)}`)
        const geocoded = await geocodeResponse.json()
        if (!geocoded[0]) throw new Error('Home location could not be mapped')
        const homePoint = [Number(geocoded[0].lat), Number(geocoded[0].lon)]
        setOrigin(homePoint)
        const routeResponse = await fetch(`https://router.project-osrm.org/route/v1/driving/${homePoint[1]},${homePoint[0]};${routeDestination[1]},${routeDestination[0]}?overview=full&geometries=geojson`)
        const routeData = await routeResponse.json()
        const coordinates = routeData.routes?.[0]?.geometry?.coordinates || []
        setRoute(coordinates.map(([longitude, latitude]) => [latitude, longitude]))
      } catch (error) {
        setMapError(error.message)
      }
    }
    loadRoute()
    return undefined
  }, [homeLocation, destinationLatitude, destinationLongitude])

  if (!destination) return <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">This request has no exact coordinates. Use the directions link with the location name.</p>
  const mapCenter = origin || destination
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(homeLocation || '')}&destination=${destination[0]},${destination[1]}`

  return <div className="mt-4 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="flex items-center gap-2 text-xs text-slate-300"><Navigation className="h-4 w-4 text-cyan-400" />{origin ? 'Route calculated from your home location' : 'Mapping your home location...'}</p><a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 underline"><ExternalLink className="h-3 w-3" />Open directions</a></div>{mapError && <p className="text-xs text-amber-300">{mapError}. The directions link is still available.</p>}<MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="h-64 w-full rounded-2xl"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{origin && <Marker position={origin}><Popup>Your home: {homeLocation}</Popup></Marker>}<Marker position={destination}><Popup>Response location: {request.location}</Popup></Marker>{route.length > 1 && <Polyline positions={route} pathOptions={{ color: '#22d3ee', weight: 5 }} />}</MapContainer></div>
}

export default function VolunteerPage() {
  const requestIdFromUrl = new URLSearchParams(window.location.search).get('requestId')
  const { user } = useAuth()
  const reduceMotion = useReducedMotion()
  const [items, setItems] = useState([])
  const [applications, setApplications] = useState([])
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const [opportunitiesResult, applicationsResult] = await Promise.allSettled([apiFetch('/opportunities'), apiFetch('/opportunities/applications/my')])
    if (opportunitiesResult.status === 'fulfilled') {
      const opportunities = opportunitiesResult.value.data || []
      setItems(requestIdFromUrl ? opportunities.filter((item) => item.sourceRequest?.toString() === requestIdFromUrl) : opportunities)
    } else {
      setItems([])
      setError(opportunitiesResult.reason.message)
    }
    if (applicationsResult.status === 'fulfilled') {
      setApplications(applicationsResult.value.data || [])
    } else {
      setError(applicationsResult.reason.message)
    }
  }
  useEffect(() => {
    load()
    const refreshTimer = window.setInterval(load, 15000)
    return () => window.clearInterval(refreshTimer)
  }, [])

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

  const acceptedAssignments = applications.filter((application) => application.status === 'APPROVED' && application.opportunity)
  const userLocation = user?.location || ''

  return <div className="relief-page relief-page--volunteer volunteer-cinematic mx-auto min-h-[calc(100vh-12rem)] max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
    <div className="volunteer-cinematic__signal" aria-hidden="true" />
    <header className="volunteer-cinematic__header"><span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Field mobilization</span><h1 className="mt-2 text-3xl font-black text-white">Volunteer opportunities</h1><p className="mt-2 text-sm text-slate-400">Apply for a real response assignment and help organizations staff relief operations.</p></header>
    {message && <p className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/50 p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />{message}</p>}
    {error && <p className="rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
    {acceptedAssignments.length > 0 && <section className="space-y-4"><div><span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Accepted volunteer work</span><h2 className="mt-2 text-2xl font-black text-white">Your active assignment</h2></div>{acceptedAssignments.map((assignment) => { const opportunity = assignment.opportunity; const request = opportunity.sourceRequest; const donation = opportunity.sourceDonation; return <article key={assignment._id} className="rounded-3xl border border-cyan-500/30 bg-slate-900/80 p-6 shadow-xl"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><h3 className="text-xl font-bold text-white">{opportunity.title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{request?.description || opportunity.description}</p></div><span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase text-emerald-300">Accepted</span></div><div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2"><p><strong className="text-white">What:</strong> {donation?.item || request?.requiredResources || opportunity.category}</p><p><strong className="text-white">When:</strong> {new Date(opportunity.date).toLocaleString()}</p><p><strong className="text-white">Where:</strong> {request?.location || opportunity.location}</p><p><strong className="text-white">Urgency:</strong> {request?.urgency || 'Response support'}</p></div><AssignmentMap assignment={assignment} homeLocation={userLocation} /></article> })}</section>}
    <section><div className="mb-4"><span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Open response requests</span><h2 className="mt-2 text-2xl font-black text-white">Volunteer opportunities</h2></div>{items.length === 0 ? <div className="rounded-3xl border border-dashed border-emerald-500/30 bg-slate-900/60 p-10 text-center"><p className="text-sm font-semibold text-slate-200">No volunteer support requests are open right now.</p><p className="mt-2 text-xs text-slate-400">When an individual requests volunteer support with a donation, the assignment will appear here for volunteers and NGOs.</p></div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <motion.article key={item._id} initial={reduceMotion ? false : { opacity: 0, y: 24, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: reduceMotion ? 0 : index * .06, duration: .45, ease: 'easeOut' }} whileHover={reduceMotion ? undefined : { y: -7, scale: 1.012 }} className="volunteer-opportunity-card rounded-3xl border border-slate-800 bg-slate-900/75 p-5 shadow-xl"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-white">{item.title}</h2><span className="text-[10px] font-bold text-emerald-400">OPEN</span></div><p className="mt-3 text-sm leading-relaxed text-slate-400">{item.description}</p><div className="mt-4 space-y-2 text-xs text-slate-400"><p className="flex gap-2"><MapPin className="h-4 w-4 text-cyan-400" />{item.location}</p><p className="flex gap-2"><CalendarDays className="h-4 w-4 text-cyan-400" />{new Date(item.date).toLocaleDateString()}</p><p className="flex gap-2"><Users className="h-4 w-4 text-cyan-400" />{item.requiredVolunteers} volunteer needed</p></div><button disabled={Boolean(busy)} onClick={() => apply(item._id)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50">{busy === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'I volunteer for this'}</button></motion.article>)}</div>}</section>
  </div>
}
