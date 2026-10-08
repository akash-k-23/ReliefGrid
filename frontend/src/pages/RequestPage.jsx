import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Loader2, MapPin, Mic, MicOff, PackageCheck, Phone, Send, UserRound } from 'lucide-react'
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { apiFetch } from '../lib/api'

const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-400'
const defaultCenter = [13.0827, 80.2707]
const mapMarkerIcon = L.divIcon({
  className: 'request-map-marker',
  html: '<span class="request-map-marker__blob"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function MapPicker({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng)
    },
  })
  return null
}

export default function RequestPage() {
  const recognitionRef = useRef(null)
  const [requests, setRequests] = useState([])
  const [donations, setDonations] = useState([])
  const [donationBusy, setDonationBusy] = useState('')
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [markerPosition, setMarkerPosition] = useState(defaultCenter)
  const [form, setForm] = useState({
    title: '',
    category: 'Medical',
    urgency: 'HIGH',
    description: '',
    location: '',
    latitude: defaultCenter[0],
    longitude: defaultCenter[1],
    contactPhone: '',
    peopleAffected: 1,
    requiredResources: '',
  })
  const [state, setState] = useState({ loading: true, submitting: false, error: '', success: '', voiceError: '', voiceListening: false })

  useEffect(() => {
    const load = async () => {
      try {
        const [requestData, donationData] = await Promise.all([apiFetch('/requests/my'), apiFetch('/donations/for-my-requests')])
        setRequests(requestData.data || [])
        setDonations(donationData.data || [])
      } catch (error) {
        setRequests([])
        setState((current) => ({ ...current, error: error.message }))
      } finally {
        setState((current) => ({ ...current, loading: false }))
      }
    }
    load()
  }, [])

  useEffect(() => () => {
    recognitionRef.current?.stop()
  }, [])

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const updateSelectedLocation = (latitude, longitude, displayName) => {
    const normalizedLatitude = Number(latitude)
    const normalizedLongitude = Number(longitude)

    setMapCenter([normalizedLatitude, normalizedLongitude])
    setMarkerPosition([normalizedLatitude, normalizedLongitude])
    setForm((current) => ({
      ...current,
      latitude: normalizedLatitude,
      longitude: normalizedLongitude,
      location: displayName || current.location || 'Selected location',
    }))
  }

  const resolveAddress = async (address) => {
    const trimmed = address?.trim()
    if (!trimmed) return

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(trimmed)}`)
      const data = await response.json()
      if (!Array.isArray(data) || !data[0]) {
        throw new Error('No match found for that address. Try a more specific place name.')
      }
      const result = data[0]
      updateSelectedLocation(result.lat, result.lon, result.display_name)
    } catch (error) {
      setState((current) => ({ ...current, error: error.message || 'Unable to find that location on the map.' }))
    }
  }

  const handleMapPick = async (latlng) => {
    const { lat, lng } = latlng
    updateSelectedLocation(lat, lng, 'Selected map location')
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
      const data = await response.json()
      if (data?.display_name) {
        updateSelectedLocation(lat, lng, data.display_name)
      }
    } catch (error) {
      console.warn('Reverse geocoding did not complete:', error)
    }
  }

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setState((current) => ({ ...current, voiceError: 'Speech recognition is not supported in this browser.' }))
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-IN'

    recognition.onstart = () => setState((current) => ({ ...current, voiceError: '', voiceListening: true }))
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript ?? '').join(' ').trim()
      if (!transcript) return
      setForm((current) => ({
        ...current,
        description: current.description ? `${current.description} ${transcript}`.trim() : transcript,
      }))
    }
    recognition.onerror = (event) => {
      const message = event.error === 'not-allowed' ? 'Microphone permission was denied.' : event.error === 'no-speech' ? 'No speech was detected.' : 'Speech recognition could not process this input.'
      setState((current) => ({ ...current, voiceError: message, voiceListening: false }))
    }
    recognition.onend = () => setState((current) => ({ ...current, voiceListening: false }))

    recognitionRef.current = recognition
    recognition.start()
  }

  const submit = async (event) => {
    event.preventDefault()
    setState((current) => ({ ...current, submitting: true, error: '', success: '', voiceError: '' }))

    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        peopleAffected: Number(form.peopleAffected),
      }
      await apiFetch('/requests', { method: 'POST', body: JSON.stringify(payload) })
      setForm({
        ...form,
        title: '',
        description: '',
        location: '',
        requiredResources: '',
        latitude: defaultCenter[0],
        longitude: defaultCenter[1],
      })
      setMapCenter(defaultCenter)
      setMarkerPosition(defaultCenter)
      setState({ loading: false, submitting: false, error: '', success: 'Request submitted to the relief coordination queue.', voiceError: '', voiceListening: false })
      const [requestData, donationData] = await Promise.all([apiFetch('/requests/my'), apiFetch('/donations/for-my-requests')])
      setRequests(requestData.data || [])
      setDonations(donationData.data || [])
    } catch (error) {
      setState((current) => ({ ...current, submitting: false, success: '', error: error.message }))
    }
  }

  const updateDonationStatus = async (donationId, status) => {
    setDonationBusy(donationId)
    try {
      await apiFetch(`/donations/${donationId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      const data = await apiFetch('/donations/for-my-requests')
      setDonations(data.data || [])
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    } finally {
      setDonationBusy('')
    }
  }

  const memoizedLocationButton = useMemo(() => (
    <button type="button" onClick={() => resolveAddress(form.location)} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Locate</button>
  ), [form.location])

  return (
    <div className="relief-page relief-page--request mx-auto min-h-[calc(100vh-12rem)] max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header>
        <span className="text-xs font-bold uppercase tracking-widest text-red-400">Priority channel</span>
        <h1 className="mt-2 text-3xl font-black text-white">Request emergency help</h1>
        <p className="mt-2 text-sm text-slate-400">Submit a real relief request for verified responders to review.</p>
      </header>
      {state.error && <div className="flex gap-2 rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-200"><AlertTriangle className="h-4 w-4" />{state.error}</div>}
      {state.voiceError && <div className="rounded-xl border border-amber-500/30 bg-amber-950/50 p-3 text-sm text-amber-200">{state.voiceError}</div>}
      {state.success && <div className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/50 p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />{state.success}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 text-xs font-semibold text-slate-300">Request title<input className={inputClass} name="title" value={form.title} onChange={update} required placeholder="What help is needed?" /></label>
            <label className="text-xs font-semibold text-slate-300">Category<select className={inputClass} name="category" value={form.category} onChange={update}>{['Food','Water','Medical','Shelter','Rescue','Transport','Other'].map((option) => <option key={option}>{option}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-300">Urgency<select className={inputClass} name="urgency" value={form.urgency} onChange={update}>{['LOW','MEDIUM','HIGH','CRITICAL'].map((option) => <option key={option}>{option}</option>)}</select></label>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Situation description</label>
            <div className="relative">
              <textarea className={`${inputClass} pr-12`} name="description" value={form.description} onChange={update} required rows="4" placeholder="Describe the situation and immediate risks." />
              <button type="button" onClick={handleVoiceInput} aria-label="Use voice input for situation description" className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border transition ${state.voiceListening ? 'border-red-400 bg-red-500/15 text-red-200' : 'border-slate-700 bg-slate-950 text-cyan-300 hover:border-cyan-400'}`}>
                {state.voiceListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-300 sm:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span>Location / address</span>
                {memoizedLocationButton}
              </div>
              <input className={inputClass} name="location" value={form.location} onChange={update} required placeholder="Anna Nagar, Chennai" />
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location || 'India')}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-cyan-300 underline underline-offset-2">Choose on Google Maps</a>
            </label>
            <label className="text-xs font-semibold text-slate-300">Contact phone<input className={inputClass} name="contactPhone" value={form.contactPhone} onChange={update} required placeholder="Reachable phone number" /></label>
            <label className="text-xs font-semibold text-slate-300">People affected<input className={inputClass} type="number" min="1" name="peopleAffected" value={form.peopleAffected} onChange={update} /></label>
            <label className="text-xs font-semibold text-slate-300 sm:col-span-2">Resources needed<input className={inputClass} name="requiredResources" value={form.requiredResources} onChange={update} placeholder="Water, kits, transport..." /></label>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Map selection</span>
              <span className="text-[10px] text-slate-500">{form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</span>
            </div>
            <MapContainer center={mapCenter} zoom={10} scrollWheelZoom className="h-64 w-full rounded-2xl">
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={markerPosition} icon={mapMarkerIcon}>
                <Popup>{form.location || 'Selected location'}</Popup>
              </Marker>
              <MapPicker onPick={handleMapPick} />
            </MapContainer>
          </div>

          <button disabled={state.submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-60"><Send className="h-4 w-4" />{state.submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : 'Broadcast request'}</button>
        </form>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">My requests</h2>
            <Link className="text-xs text-cyan-400" to="/home">Dashboard</Link>
          </div>
          {state.loading ? <Loader2 className="h-5 w-5 animate-spin text-cyan-400" /> : requests.length === 0 ? <p className="text-sm text-slate-400">No requests submitted yet.</p> : <div className="space-y-3">{requests.map((request) => { const requestDonations = donations.filter((donation) => donation.request?._id === request._id); return <article key={request._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex justify-between gap-3"><h3 className="font-semibold text-white">{request.title}</h3><span className="text-[10px] font-bold text-cyan-300">{request.status}</span></div><p className="mt-2 flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" />{request.location}</p><p className="mt-2 text-xs text-slate-500">{request.category} · {request.urgency} · {request.peopleAffected} affected</p>{requestDonations.length > 0 && <div className="mt-4 space-y-2 border-t border-slate-800 pt-3"><p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Support tracking</p>{requestDonations.map((donation) => { const volunteer = donation.volunteerOpportunity?.joinedVolunteers?.[0]; return <div key={donation._id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-xs text-slate-300"><PackageCheck className="h-4 w-4 text-emerald-400" />{donation.item} · {donation.quantity}</span><span className="text-[10px] font-bold uppercase text-emerald-300">{donation.status}</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400"><span>Donated by {donation.donor?.name || 'Community supporter'}</span>{volunteer && <span className="flex items-center gap-1"><UserRound className="h-3 w-3" />{volunteer.name}</span>}{volunteer?.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{volunteer.phone}</span>}{volunteer?.location && <span>{volunteer.location}</span>}</div></div> })}</div>}</article> })}</div>}
        </section>
        {donations.length > 0 && <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6"><h2 className="mb-4 text-lg font-bold text-white">Donation delivery tracking</h2><div className="space-y-3">{donations.map((donation) => <div key={donation._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold text-white">{donation.item} · {donation.quantity}</span><span className="text-xs font-bold uppercase text-cyan-300">{donation.status}</span></div><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400"><span>{donation.request?.title}</span><span>Donor: {donation.donor?.name || 'Community supporter'}</span>{donation.volunteerOpportunity?.joinedVolunteers?.[0] && <span>Volunteer: {donation.volunteerOpportunity.joinedVolunteers[0].name} · {donation.volunteerOpportunity.joinedVolunteers[0].phone} · {donation.volunteerOpportunity.joinedVolunteers[0].location}</span>}</div><div className="mt-3 flex gap-2">{donation.status === 'PLEDGED' && <button type="button" disabled={donationBusy === donation._id} onClick={() => updateDonationStatus(donation._id, 'RECEIVED')} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50">Confirm received</button>}{donation.status === 'RECEIVED' && <button type="button" disabled={donationBusy === donation._id} onClick={() => updateDonationStatus(donation._id, 'ALLOCATED')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50">Confirm delivered</button>}</div></div>)}</div></section>}
      </div>
    </div>
  )
}
