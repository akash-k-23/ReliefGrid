import { useEffect, useMemo, useState } from 'react'
import { Building2, ChevronRight, Crosshair, MapPin, Radio, RefreshCw, Route, SlidersHorizontal, Users } from 'lucide-react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { demoMapCenter, demoNgos, demoRequests, demoStudents } from '../data/reliefGridDemoData'
import { useAdaptiveMode } from '../hooks/useAdaptiveMode'

const priorityStyles = {
  Critical: 'border-red-400/40 bg-red-500/15 text-red-200',
  High: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  Medium: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200',
}

function distanceKm(from, to) {
  const earthRadius = 6371
  const latDelta = (to.latitude - from.latitude) * Math.PI / 180
  const lonDelta = (to.longitude - from.longitude) * Math.PI / 180
  const lat1 = from.latitude * Math.PI / 180
  const lat2 = to.latitude * Math.PI / 180
  const value = Math.sin(latDelta / 2) ** 2 + Math.sin(lonDelta / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function markerIcon(type, active = false) {
  const colors = { student: '#22d3ee', ngo: '#34d399', request: '#fb7185' }
  return divIcon({
    className: 'relief-map-marker',
    html: `<span style="--marker-color:${colors[type]};--marker-size:${active ? '22px' : '16px'}" class="relief-map-marker__dot ${active ? 'relief-map-marker__dot--active' : ''}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function MapFocus({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location) map.flyTo([location.latitude, location.longitude], 13, { duration: 0.7 })
  }, [location, map])
  return null
}

export default function LocationsPage() {
  const { isLowBandwidth, isReducedMotion, mode } = useAdaptiveMode()
  const [filter, setFilter] = useState('all')
  const [priority, setPriority] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [selectedId, setSelectedId] = useState(demoStudents[0].id)
  const [simulationTick, setSimulationTick] = useState(0)

  useEffect(() => {
    if (isReducedMotion || isLowBandwidth) return undefined
    const timer = window.setInterval(() => setSimulationTick((value) => value + 1), 5000)
    return () => window.clearInterval(timer)
  }, [isLowBandwidth, isReducedMotion])

  const selectedStudent = demoStudents.find((student) => student.id === selectedId) || demoStudents[0]
  const selectedRequest = demoRequests.find((request) => request.studentId === selectedStudent.id)
  const nearbyNgos = useMemo(() => demoNgos
    .map((ngo) => ({ ...ngo, distance: distanceKm(selectedStudent, ngo) }))
    .filter((ngo) => ngo.availability !== 'Dispatched')
    .sort((first, second) => first.distance - second.distance), [selectedStudent])
  const visibleStudents = demoStudents.filter((student) => priority === 'all' || student.priority === priority)
  const visibleNgos = demoNgos.filter((ngo) => availability === 'all' || ngo.availability === availability)
  const selectedLocation = selectedStudent
  const activeNgos = nearbyNgos.slice(0, 3)

  const showStudents = filter === 'all' || filter === 'students' || filter === 'requests'
  const showNgos = filter === 'all' || filter === 'ngos'
  const showRequests = filter === 'all' || filter === 'requests'

  return (
    <div className="relief-page relief-page--locations mx-auto min-h-[calc(100vh-12rem)] max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300"><Crosshair className="h-4 w-4" /> Operations map <span className="text-slate-600">/</span> Demo data</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Location Tracer</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Visualize sample requests, response hubs, and the nearest available help around each student.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
          <span className={`h-2 w-2 rounded-full ${mode === 'full' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          {mode === 'full' ? 'Full experience' : mode === 'reduced-motion' ? 'Reduced motion' : 'Low-bandwidth mode'}
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-slate-950/70 shadow-2xl shadow-emerald-950/20">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 p-4">
            <div className="flex rounded-xl border border-slate-700 bg-slate-900/80 p-1" role="tablist" aria-label="Map layer filters">
              {['all', 'students', 'ngos', 'requests'].map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition-colors ${filter === item ? 'bg-emerald-400 text-slate-950' : 'text-slate-400 hover:text-white'}`}>{item}</button>)}
            </div>
            <label className="ml-auto flex items-center gap-2 text-xs text-slate-400"><SlidersHorizontal className="h-4 w-4" /><select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-slate-200"><option value="all">All priorities</option>{['Critical', 'High', 'Medium'].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="flex items-center gap-2 text-xs text-slate-400"><select value={availability} onChange={(event) => setAvailability(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-slate-200"><option value="all">All NGO status</option>{['Available', 'Limited', 'Dispatched'].map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <MapContainer center={demoMapCenter} zoom={12} scrollWheelZoom={!isLowBandwidth} className="h-[430px] w-full sm:h-[520px]">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapFocus location={selectedLocation} />
            {showStudents && visibleStudents.map((student) => <Marker key={student.id} position={[student.latitude, student.longitude]} icon={markerIcon('student', student.id === selectedId)} eventHandlers={{ click: () => setSelectedId(student.id) }}><Popup><strong>{student.name}</strong><br />{student.requestType}<br />{student.status}</Popup></Marker>)}
            {showNgos && visibleNgos.map((ngo) => <Marker key={ngo.id} position={[ngo.latitude, ngo.longitude]} icon={markerIcon('ngo')}><Popup><strong>{ngo.name}</strong><br />{ngo.type} · {ngo.availability}<br />Capacity: {ngo.capacity}</Popup></Marker>)}
            {showRequests && demoRequests.filter((request) => priority === 'all' || request.priority === priority).map((request) => <Circle key={request.id} center={[request.latitude, request.longitude]} radius={simulationTick % 2 ? 55 : 45} pathOptions={{ color: request.priority === 'Critical' ? '#fb7185' : '#fbbf24', opacity: 0.6, fillOpacity: 0.08 }} />)}
          </MapContainer>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 px-4 py-3 text-xs text-slate-400"><span><span className="inline-block h-2 w-2 rounded-full bg-cyan-400" /> Student <span className="ml-3 inline-block h-2 w-2 rounded-full bg-emerald-400" /> NGO <span className="ml-3 inline-block h-2 w-2 rounded-full bg-rose-400" /> Active request</span><span>Sample coordinates only · no live GPS</span></div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-800 bg-slate-950/75 p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Selected request</p><h2 className="mt-2 text-xl font-bold text-white">{selectedStudent.name}</h2><p className="mt-1 text-xs text-slate-400">{selectedStudent.department} · {selectedStudent.requestType}</p></div><span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${priorityStyles[selectedStudent.priority]}`}>{selectedStudent.priority}</span></div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><span className="block text-slate-500">Status</span><strong className="mt-1 block text-emerald-300">{selectedRequest?.status}</strong></div><div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><span className="block text-slate-500">Updated</span><strong className="mt-1 block text-white">{selectedStudent.timestamp}</strong></div></div>
            <p className="mt-4 flex gap-2 text-xs leading-5 text-slate-400"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />{selectedStudent.description}</p>
          </section>

          <section className="rounded-3xl border border-emerald-400/20 bg-emerald-950/15 p-5">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Nearest assistance</p><h2 className="mt-1 text-lg font-bold text-white">Available NGO hubs</h2></div><Route className="h-5 w-5 text-emerald-300" /></div>
            <div className="mt-4 space-y-2">{activeNgos.map((ngo, index) => <button key={ngo.id} onClick={() => setSelectedId(selectedStudent.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${index === 0 ? 'border-emerald-300/40 bg-emerald-400/10' : 'border-slate-800 bg-slate-950/40 hover:border-emerald-400/30'}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300"><Building2 className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{ngo.name}</strong><span className="text-xs text-slate-400">{ngo.type} · {ngo.availability}</span></span><span className="text-right text-xs font-bold text-emerald-300">{ngo.distance.toFixed(1)} km<ChevronRight className="ml-auto h-3 w-3" /></span></button>)}{activeNgos.length === 0 && <p className="text-sm text-slate-400">No available NGO hubs nearby.</p>}</div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-950/75 p-5"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold text-white"><Users className="h-5 w-5 text-cyan-300" /> Requests</h2><span className="text-xs text-slate-500">{visibleStudents.length} sample records</span></div><div className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">{visibleStudents.map((student) => <button key={student.id} onClick={() => setSelectedId(student.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${student.id === selectedId ? 'bg-cyan-400/10' : 'hover:bg-slate-900'}`}><span className={`h-2 w-2 rounded-full ${student.priority === 'Critical' ? 'bg-rose-400' : student.priority === 'High' ? 'bg-amber-400' : 'bg-cyan-400'}`} /><span className="min-w-0 flex-1 truncate text-sm text-slate-200">{student.name}</span><span className="text-[10px] text-slate-500">{student.status}</span></button>)}</div></section>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3 text-xs text-slate-400"><span className="flex items-center gap-2"><Radio className="h-4 w-4 text-emerald-300" /> Demo simulation {simulationTick > 0 ? 'is active' : 'is ready'}; movement is illustrative only.</span><button onClick={() => setSimulationTick((value) => value + 1)} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"><RefreshCw className="h-3.5 w-3.5" /> Refresh status</button></div>
    </div>
  )
}
