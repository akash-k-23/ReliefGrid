import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Loader2, Activity, Waves, Wind, Flame, CircleHelp } from 'lucide-react'
import { apiFetch } from '../lib/api'
import ImpactDashboard from '../components/ImpactDashboard'

export default function HomePage() {
  const [requests, setRequests] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [disasterFeed, setDisasterFeed] = useState({ events: [], status: 'loading', lastUpdated: null, source: 'USGS Earthquake Hazards Program' })
  const [showDisasters, setShowDisasters] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch('/requests/my'),
      apiFetch('/opportunities'),
    ])
      .then(([requestData, opportunityData]) => {
        setRequests(requestData.data || [])
        setOpportunities(opportunityData.data || [])
      })
      .catch((error) => {
        console.error(error.message)
        setRequests([])
        setOpportunities([])
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

  const disasterEvents = Array.isArray(disasterFeed.events) ? disasterFeed.events : []
  const disasterIcon = (type) => ({ earthquake: Activity, tsunami: Waves, flood: Waves, cyclone: Wind, 'severe-weather': Wind, wildfire: Flame })[type] || CircleHelp

  return (
    <div className="relief-page relief-page--home home-earthquake-shake dashboard-water-scene mx-auto min-h-[calc(100vh-12rem)] max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="dashboard-rain" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><div className="dashboard-lightning" /><div className="dashboard-waterline" /><div className="dashboard-wave dashboard-wave--one" /><div className="dashboard-wave dashboard-wave--two" /></div>
      <p className="home-access-note">Anyone can register or log in. Registered users can request relief and contribute through the programs available to them.</p>
      <ImpactDashboard showImpact={false} showEmergency showEmergencyContacts={false} />
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-white">Recent requests</h2><Link to="/request" className="text-xs text-cyan-400">View all</Link></div>
              {requests.slice(0, 5).map((item) => (
                <div key={item._id || item.id || item.title} className="flex items-center justify-between border-b border-slate-800 py-3 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.location} · {item.category}</p>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-300">{item.status}</span>
                </div>
              ))}
            </section>

            <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-white">Volunteer matches</h2><Link to="/volunteer" className="text-xs text-cyan-400">Open roles</Link></div>
              {opportunities.slice(0, 4).map((item) => (
                <div key={item._id} className="flex items-center justify-between border-b border-slate-800 py-3 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.location} · {item.category}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300"><ArrowUpRight className="h-3 w-3" />{item.joinedVolunteers?.length || 0}/{item.requiredVolunteers}</span>
                </div>
              ))}
            </section>
          </div>

          <section className="rounded-[24px] border border-orange-400/20 bg-slate-950/75 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-white">LIVE Disaster Updates<span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase ${disasterFeed.status === 'live' ? 'text-emerald-300' : disasterFeed.status === 'stale' ? 'text-amber-300' : 'text-slate-400'}`}><span className={`h-1.5 w-1.5 rounded-full ${disasterFeed.status === 'live' ? 'bg-emerald-400' : disasterFeed.status === 'stale' ? 'bg-amber-400' : 'bg-slate-500'}`} />{disasterFeed.status}</span></h2>
                <p className="mt-1 text-xs text-slate-400">Source: {disasterFeed.source || 'USGS Earthquake Hazards Program'} · {disasterFeed.lastUpdated ? `Last updated ${new Date(disasterFeed.lastUpdated).toLocaleString()}` : 'Awaiting official feed'} </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-300"><input type="checkbox" checked={showDisasters} onChange={(event) => setShowDisasters(event.target.checked)} className="h-4 w-4 accent-orange-500" />Show live updates</label>
            </div>
            {disasterFeed.error && <p className="mt-3 text-xs text-amber-300">Feed unavailable; showing cached data when available. No demo disaster reports are displayed.</p>}
            {showDisasters && <div className="mt-4 divide-y divide-slate-800">
              {disasterEvents.slice(0, 5).map((event) => {
                const Icon = disasterIcon(event.type)
                return <article key={event.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-300"><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><h3 className="text-sm font-semibold text-white">{event.title}</h3><span className="text-[10px] font-bold uppercase text-orange-300">{event.severity}</span></div>
                    <p className="mt-1 text-xs text-slate-400">{event.location} · {event.type.replace('-', ' ')}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{event.source} · {event.startedAt ? new Date(event.startedAt).toLocaleString() : 'Start time not reported'}</p>
                    {event.sourceUrl && <a className="mt-1 inline-block text-[11px] text-cyan-300 underline" href={event.sourceUrl} target="_blank" rel="noreferrer">Source report</a>}
                  </div>
                </article>
              })}
              {disasterEvents.length === 0 && <p className="py-3 text-sm text-slate-400">No disaster events are currently available from the official feed.</p>}
            </div>}
            <p className="mt-4 border-t border-slate-800 pt-3 text-[10px] text-slate-500">Earthquake data from the U.S. Geological Survey (USGS).</p>
          </section>
        </>
      )}
    </div>
  )
}
