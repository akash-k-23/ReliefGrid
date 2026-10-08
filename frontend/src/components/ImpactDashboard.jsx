import { useEffect, useState } from 'react'
import { ArrowUpRight, Award, BellRing, CheckCircle2, Clock3, HandHeart, Loader2, MapPin, PhoneCall, ShieldAlert, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { emergencyContactsFallback } from '../data/emergencyContacts'

const types = ['ALL', 'Flood', 'Cyclone', 'Earthquake', 'Fire', 'Medical']
const formatAmount = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)

export default function ImpactDashboard({ showImpact = true, showEmergency = true, showEmergencyContacts = true, showLeaderboard = false }) {
  const { user, setUser } = useAuth()
  const [impact, setImpact] = useState(null)
  const [activities, setActivities] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardTotals, setLeaderboardTotals] = useState(null)
  const [activityFilter, setActivityFilter] = useState('all')
  const [activityPage, setActivityPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [preferences, setPreferences] = useState({ emergencySmsOptIn: false, phoneVerifiedAt: null, radiusKm: 10, emergencyTypes: ['ALL'], quietHours: { enabled: false, start: '22:00', end: '07:00' } })
  const [coordinates, setCoordinates] = useState({ latitude: '', longitude: '' })
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [nearby, setNearby] = useState({ requests: [], opportunities: [] })
  const [contacts, setContacts] = useState(emergencyContactsFallback)
  const [contactError, setContactError] = useState(false)
  const [status, setStatus] = useState({ loading: true, saving: false, message: '', error: '' })

  useEffect(() => {
    let active = true
    const load = async () => {
      const results = await Promise.allSettled([
        showImpact ? apiFetch('/users/me/impact') : Promise.resolve(null),
        showEmergency ? apiFetch('/emergency/preferences') : Promise.resolve(null),
        showEmergency ? apiFetch('/emergency/alerts?limit=5') : Promise.resolve(null),
        showEmergency ? apiFetch('/emergency/nearby') : Promise.resolve(null),
        showEmergency && showEmergencyContacts ? apiFetch('/emergency/contacts') : Promise.resolve(null),
      ])
      if (!active) return
      const [impactResult, preferenceResult, alertResult, nearbyResult, contactResult] = results
      if (impactResult.status === 'fulfilled' && impactResult.value) setImpact(impactResult.value.data)
      if (preferenceResult.status === 'fulfilled' && preferenceResult.value) {
        const value = preferenceResult.value.data
        setPreferences({ emergencySmsOptIn: value.emergencySmsOptIn, phoneVerifiedAt: value.phoneVerifiedAt, radiusKm: value.radiusKm || 10, emergencyTypes: value.emergencyTypes?.length ? value.emergencyTypes : ['ALL'], quietHours: value.quietHours || { enabled: false, start: '22:00', end: '07:00' } })
        if (value.alertLocation?.coordinates?.length === 2) setCoordinates({ longitude: String(value.alertLocation.coordinates[0]), latitude: String(value.alertLocation.coordinates[1]) })
      } else if (preferenceResult.reason?.message.includes('(401')) {
        setStatus((current) => ({ ...current, error: 'Sign in again to load your private impact data.' }))
      }
      if (alertResult.status === 'fulfilled' && alertResult.value) setAlerts(alertResult.value.data.items || [])
      if (nearbyResult.status === 'fulfilled' && nearbyResult.value) setNearby(nearbyResult.value.data || { requests: [], opportunities: [] })
      if (contactResult.status === 'fulfilled' && contactResult.value?.data?.length) setContacts(contactResult.value.data)
      else if (showEmergency && showEmergencyContacts) setContactError(true)
      setStatus((current) => ({ ...current, loading: false }))
    }
    load()
    return () => { active = false }
  }, [showEmergency, showEmergencyContacts, showImpact])

  useEffect(() => {
    if (!showImpact) return undefined
    let active = true
    apiFetch(`/users/me/contributions?type=${activityFilter}&page=${activityPage}&limit=10`)
      .then((result) => {
        if (!active) return
        setActivities((current) => activityPage === 1 ? result.data.items : [...current, ...result.data.items])
        setHasMore(result.data.hasMore)
      })
      .catch((error) => setStatus((current) => ({ ...current, error: current.error || error.message })))
    return () => { active = false }
  }, [activityFilter, activityPage, showImpact])

  useEffect(() => {
    if (!showLeaderboard || !showImpact) return undefined
    let active = true
    apiFetch('/users/impact-leaderboard')
      .then((result) => {
        if (!active) return
        setLeaderboard(result.data.leaderboard || [])
        setLeaderboardTotals(result.data.totals || null)
      })
      .catch((error) => setStatus((current) => ({ ...current, error: current.error || error.message })))
    return () => { active = false }
  }, [showImpact, showLeaderboard])

  const setPref = (field, value) => setPreferences((current) => ({ ...current, [field]: value }))

  const toggleType = (type) => setPreferences((current) => {
    if (type === 'ALL') return { ...current, emergencyTypes: ['ALL'] }
    const withoutAll = current.emergencyTypes.filter((item) => item !== 'ALL')
    const selected = withoutAll.includes(type) ? withoutAll.filter((item) => item !== type) : [...withoutAll, type]
    return { ...current, emergencyTypes: selected.length ? selected : ['ALL'] }
  })

  const locateMe = () => {
    if (!navigator.geolocation) {
      setStatus((current) => ({ ...current, error: 'Location is not available in this browser. Enter coordinates manually.' }))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setCoordinates({ latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) }),
      () => setStatus((current) => ({ ...current, error: 'Location permission was not granted. You can enter coordinates manually.' })),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    )
  }

  const sendVerification = async () => {
    setStatus((current) => ({ ...current, saving: true, message: '', error: '' }))
    try {
      const result = await apiFetch('/emergency/phone-verification', { method: 'POST', body: JSON.stringify({}) })
      setVerificationSent(true)
      setStatus((current) => ({ ...current, message: result.message }))
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }))
    } finally {
      setStatus((current) => ({ ...current, saving: false }))
    }
  }

  const confirmVerification = async (event) => {
    event.preventDefault()
    setStatus((current) => ({ ...current, saving: true, message: '', error: '' }))
    try {
      const result = await apiFetch('/emergency/phone-verification/confirm', { method: 'POST', body: JSON.stringify({ code: verificationCode }) })
      setPreferences((current) => ({ ...current, phoneVerifiedAt: result.data.phoneVerifiedAt }))
      if (user) setUser({ ...user, phoneVerifiedAt: result.data.phoneVerifiedAt })
      setVerificationCode('')
      setStatus((current) => ({ ...current, message: result.message }))
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }))
    } finally {
      setStatus((current) => ({ ...current, saving: false }))
    }
  }

  const savePreferences = async (event) => {
    event.preventDefault()
    setStatus((current) => ({ ...current, saving: true, message: '', error: '' }))
    const body = {
      emergencySmsOptIn: preferences.emergencySmsOptIn,
      radiusKm: Number(preferences.radiusKm),
      emergencyTypes: preferences.emergencyTypes,
      quietHours: preferences.quietHours,
    }
    if (preferences.emergencySmsOptIn) {
      body.latitude = Number(coordinates.latitude)
      body.longitude = Number(coordinates.longitude)
    }
    try {
      const result = await apiFetch('/emergency/preferences', { method: 'PATCH', body: JSON.stringify(body) })
      setPreferences((current) => ({ ...current, ...result.data }))
      if (preferences.emergencySmsOptIn) {
        const [nearbyResult, alertResult] = await Promise.all([apiFetch('/emergency/nearby'), apiFetch('/emergency/alerts?limit=5')])
        setNearby(nearbyResult.data)
        setAlerts(alertResult.data.items || [])
      }
      setStatus((current) => ({ ...current, message: result.message }))
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }))
    } finally {
      setStatus((current) => ({ ...current, saving: false }))
    }
  }

  const respond = async (requestId, response) => {
    try {
      await apiFetch(`/emergency/requests/${requestId}/respond`, { method: 'POST', body: JSON.stringify({ response }) })
      const result = await apiFetch('/emergency/alerts?limit=5')
      setAlerts(result.data.items || [])
      setStatus((current) => ({ ...current, message: 'Your response was recorded.', error: '' }))
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }))
    }
  }

  const stats = impact?.stats || {}
  const donationTypes = Object.entries(stats.verifiedDonationBreakdown || {})
  const nextDonationBadge = (impact?.achievements || []).find((badge) => badge.category === 'DONATION' && !badge.unlocked)
  const donationProgress = nextDonationBadge ? Math.min(100, Math.floor((nextDonationBadge.current / nextDonationBadge.threshold) * 100)) : 100
  const statItems = [
    { title: 'Verified donations', value: stats.verifiedDonations ?? '—', detail: `${formatAmount(stats.recordedCashAmount)} recorded cash`, icon: HandHeart, tone: 'text-cyan-200' },
    { title: 'Volunteer activities', value: stats.completedVolunteerActivities ?? '—', detail: `${stats.verifiedVolunteerHours || 0} verified hours`, icon: Users, tone: 'text-emerald-200' },
    { title: 'Requests supported', value: stats.helpRequestsSupported ?? '—', detail: stats.peopleReached === null ? 'People reached not measured' : `${stats.peopleReached} people reached`, icon: ShieldAlert, tone: 'text-amber-200' },
    { title: 'Active contributions', value: stats.activeContributions ?? '—', detail: 'Pledges and current assignments', icon: Clock3, tone: 'text-sky-200' },
  ]

  return <div className={`space-y-8 ${showEmergencyContacts ? '' : 'impact-dashboard--without-contacts'}`}>
    {status.message && <p role="status" className="flex gap-2 border border-emerald-400/30 bg-emerald-950/30 p-3 text-sm text-emerald-100"><CheckCircle2 className="h-4 w-4 shrink-0" />{status.message}</p>}
    {status.error && <p role="alert" className="border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-100">{status.error}</p>}

    {showImpact && <>
    <section aria-labelledby="impact-heading">
      <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Your verified contribution</p><h2 id="impact-heading" className="mt-1 text-xl font-bold text-white">Impact at a glance</h2></div>{status.loading && <Loader2 className="h-4 w-4 animate-spin text-cyan-200" aria-label="Loading impact" />}</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{statItems.map(({ title, value, detail, icon: Icon, tone }) => <article key={title} className="border border-slate-700/80 bg-slate-950/70 p-4"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-slate-300">{title}</h3><Icon className={`h-4 w-4 ${tone}`} /></div><p className="mt-4 text-3xl font-black tabular-nums text-white">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></article>)}</div>
    </section>

    {showLeaderboard && <section aria-label="Donation and relief overview" className="grid gap-5 lg:grid-cols-2">
      <div className="border border-slate-700/80 bg-slate-950/60 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Giving activity</p><h2 className="mt-1 text-lg font-bold text-white">Donation overview</h2></div><HandHeart className="h-5 w-5 text-cyan-200" /></div><div className="mt-4 space-y-3">{donationTypes.map(([type, count]) => <div key={type}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="text-slate-300">{type.toLowerCase()}</span><span className="font-semibold text-white">{count}</span></div><div className="h-1.5 bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${stats.verifiedDonations ? Math.max(4, (count / stats.verifiedDonations) * 100) : 0}%` }} /></div></div>)}{donationTypes.length === 0 && <p className="text-sm text-slate-400">Verified donation categories will appear here.</p>}</div><div className="mt-5 border-t border-slate-800 pt-4"><div className="flex justify-between gap-3 text-xs"><span className="text-slate-300">Next donation achievement</span><span className="font-semibold text-cyan-100">{nextDonationBadge?.name || 'All donation milestones unlocked'}</span></div><div className="mt-2 h-2 bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${donationProgress}%` }} /></div>{nextDonationBadge && <p className="mt-1 text-[11px] text-slate-500">{nextDonationBadge.current} of {nextDonationBadge.threshold} verified donations</p>}</div></div>
      <div className="border border-slate-700/80 bg-slate-950/60 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Verified outcomes</p><h2 className="mt-1 text-lg font-bold text-white">Relief resources &amp; volunteers</h2></div><Users className="h-5 w-5 text-emerald-200" /></div><p className="mt-3 text-xs leading-5 text-slate-400">Resource categories are counted from verified donations. This does not estimate delivery volume or people served.</p><div className="mt-4 grid grid-cols-2 gap-3"><div className="border border-slate-800 p-3"><p className="text-2xl font-black text-white">{stats.helpRequestsSupported ?? 0}</p><p className="mt-1 text-[11px] text-slate-400">Distinct requests supported</p></div><div className="border border-slate-800 p-3"><p className="text-2xl font-black text-white">{stats.completedVolunteerActivities ?? 0}</p><p className="mt-1 text-[11px] text-slate-400">Completed relief activities</p></div><div className="border border-slate-800 p-3"><p className="text-2xl font-black text-white">{leaderboardTotals?.contributors ?? 0}</p><p className="mt-1 text-[11px] text-slate-400">Verified contributors</p></div><div className="border border-slate-800 p-3"><p className="text-2xl font-black text-white">{leaderboardTotals?.completedActivities ?? 0}</p><p className="mt-1 text-[11px] text-slate-400">Completed volunteer activities</p></div></div></div>
    </section>}

    <section className="border-l-2 border-emerald-300/70 bg-slate-950/50 px-5 py-4" aria-labelledby="summary-heading"><h2 id="summary-heading" className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Impact summary</h2><p className="mt-2 text-sm leading-6 text-slate-200">{impact?.summary || 'Verified activity will appear here as contributions are completed.'}</p><p className="mt-2 text-xs text-slate-500">Only verified donations and completed activities are counted. People reached is omitted unless reliably measured.</p></section>

    <section aria-labelledby="achievements-heading"><div className="mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-amber-200" /><h2 id="achievements-heading" className="text-xl font-bold text-white">Achievements</h2><span className="text-xs text-slate-400">{impact?.achievements?.filter((badge) => badge.unlocked).length || 0} / {impact?.achievements?.length || 14} earned</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(impact?.achievements || []).map((badge) => <article key={badge.badgeId} className={`border p-4 ${badge.unlocked ? 'border-amber-300/30 bg-amber-950/20' : 'border-slate-800 bg-slate-950/40'}`}><div className="flex items-start justify-between gap-3"><div><h3 className={`text-sm font-bold ${badge.unlocked ? 'text-amber-100' : 'text-slate-300'}`}>{badge.name}</h3><p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{badge.category.toLowerCase()}</p></div><Award className={`h-5 w-5 shrink-0 ${badge.unlocked ? 'text-amber-200' : 'text-slate-600'}`} /></div><div className="mt-4 h-1.5 overflow-hidden bg-slate-800"><div className="h-full bg-emerald-300 transition-[width]" style={{ width: `${badge.progress}%` }} /></div><p className="mt-2 flex justify-between text-[11px] text-slate-400"><span>{badge.unlocked ? `Unlocked ${new Date(badge.unlockedAt).toLocaleDateString()}` : `${badge.current} / ${badge.threshold}`}</span><span>{badge.progress}%</span></p></article>)}</div></section>

    <section aria-labelledby="timeline-heading"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Verified and active records</p><h2 id="timeline-heading" className="mt-1 text-xl font-bold text-white">Activity timeline</h2></div><div className="flex border border-slate-700" role="group" aria-label="Filter activity"><button onClick={() => { setActivityFilter('all'); setActivityPage(1) }} aria-pressed={activityFilter === 'all'} className={`px-3 py-2 text-xs ${activityFilter === 'all' ? 'bg-cyan-300/15 text-cyan-100' : 'text-slate-400'}`}>All</button><button onClick={() => { setActivityFilter('donation'); setActivityPage(1) }} aria-pressed={activityFilter === 'donation'} className={`border-l border-slate-700 px-3 py-2 text-xs ${activityFilter === 'donation' ? 'bg-cyan-300/15 text-cyan-100' : 'text-slate-400'}`}>Donations</button><button onClick={() => { setActivityFilter('volunteer'); setActivityPage(1) }} aria-pressed={activityFilter === 'volunteer'} className={`border-l border-slate-700 px-3 py-2 text-xs ${activityFilter === 'volunteer' ? 'bg-cyan-300/15 text-cyan-100' : 'text-slate-400'}`}>Volunteering</button></div></div>
      <div className="divide-y divide-slate-800 border-y border-slate-800">{activities.map((item) => <article key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-semibold text-white">{item.title}</h3><p className="text-xs text-slate-400">{item.detail}{item.quantity ? ` · ${item.quantity}` : ''}{item.verifiedHours !== null && item.verifiedHours !== undefined ? ` · ${item.verifiedHours} verified hours` : ''}</p></div><div className="flex items-center gap-3 text-xs"><span className="text-slate-300">{item.status}</span><time className="text-slate-500" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time></div></article>)}{activities.length === 0 && <p className="py-6 text-sm text-slate-400">No contributions match this filter yet.</p>}</div>
      {hasMore && <button onClick={() => setActivityPage((page) => page + 1)} className="mt-3 min-h-10 border border-slate-700 px-4 text-xs font-semibold text-slate-200 hover:border-cyan-300">Load more activity</button>}
    </section>

    {showLeaderboard && <section aria-labelledby="leaderboard-heading"><div className="mb-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Community recognition</p><h2 id="leaderboard-heading" className="mt-1 text-xl font-bold text-white">Contributor leaderboard</h2><p className="mt-1 text-xs text-slate-400">Ranked by verified donations plus completed volunteer activities. Each record counts once.</p></div><div className="divide-y divide-slate-800 border-y border-slate-800">{leaderboard.map((entry) => <article key={`${entry.rank}-${entry.name}`} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3"><span className="text-sm font-bold text-amber-200">{entry.rank}</span><div><h3 className="text-sm font-semibold text-white">{entry.name}</h3><p className="text-[11px] text-slate-500">{entry.role.toLowerCase()} · {entry.verifiedDonations} verified donations · {entry.completedActivities} activities</p></div><span className="text-xs font-bold text-cyan-200">{entry.contributionCount}</span></article>)}{leaderboard.length === 0 && <p className="py-5 text-sm text-slate-400">The leaderboard will populate from verified contributions.</p>}</div></section>}
    </>}

    {showEmergency && <>
    <section aria-labelledby="alerts-heading" className="grid gap-5 xl:grid-cols-[1fr_.9fr]">
      <div className="border border-slate-700/80 bg-slate-950/60 p-5"><div className="flex items-center gap-2"><BellRing className="h-5 w-5 text-red-200" /><h2 id="alerts-heading" className="text-lg font-bold text-white">Emergency SMS alerts</h2></div><p className="mt-2 text-xs leading-5 text-slate-400">SMS is optional. Only location-matched urgent requests are queued, and your phone number and exact alert location are never shown to requesters.</p>
        {!preferences.phoneVerifiedAt ? <div className="mt-4 border-t border-slate-800 pt-4"><p className="text-sm font-semibold text-white">Verify your phone first</p><p className="mt-1 text-xs text-slate-400">Your profile number must use international format, for example +91 followed by your number.</p>{!verificationSent ? <button disabled={status.saving} onClick={sendVerification} className="mt-3 min-h-10 border border-cyan-300/40 px-4 text-xs font-bold text-cyan-100 disabled:opacity-50">Send verification code</button> : <form onSubmit={confirmVerification} className="mt-3 flex flex-wrap gap-2"><input aria-label="Six-digit verification code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} className="w-40 border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="000000" /><button disabled={status.saving} className="border border-emerald-300/40 px-4 py-2 text-xs font-bold text-emerald-100">Verify phone</button></form>}</div> : <form onSubmit={savePreferences} className="mt-4 space-y-4 border-t border-slate-800 pt-4">
          <label className="flex items-start gap-3 text-sm text-white"><input type="checkbox" checked={preferences.emergencySmsOptIn} onChange={(event) => setPref('emergencySmsOptIn', event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-400" /><span><strong>Opt in to emergency SMS</strong><span className="mt-1 block text-xs leading-5 text-slate-400">I consent to urgent ReliefGrid alerts at my verified number. I can opt out at any time.</span></span></label>
          {preferences.emergencySmsOptIn && <>
            <div className="space-y-2"><div className="flex items-center justify-between gap-3"><label htmlFor="alert-radius" className="text-xs font-semibold text-slate-300">Alert radius</label><span className="text-sm font-bold tabular-nums text-white">{preferences.radiusKm} km</span></div><input id="alert-radius" type="range" min="1" max="100" value={preferences.radiusKm} onChange={(event) => setPref('radiusKm', Number(event.target.value))} className="w-full accent-emerald-300" /><div className="flex justify-between text-[10px] text-slate-500"><span>1 km</span><span>100 km</span></div></div>
            <div><p className="mb-2 text-xs font-semibold text-slate-300">Emergency types</p><div className="flex flex-wrap gap-x-4 gap-y-2">{types.map((type) => <label key={type} className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={preferences.emergencyTypes.includes(type)} onChange={() => toggleType(type)} className="h-3.5 w-3.5 accent-emerald-300" />{type === 'ALL' ? 'All emergencies' : type}</label>)}</div></div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><div className="grid grid-cols-2 gap-2"><label className="text-[11px] text-slate-400">Latitude<input required type="number" min="-90" max="90" step="any" value={coordinates.latitude} onChange={(event) => setCoordinates((current) => ({ ...current, latitude: event.target.value }))} className="mt-1 w-full border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white" /></label><label className="text-[11px] text-slate-400">Longitude<input required type="number" min="-180" max="180" step="any" value={coordinates.longitude} onChange={(event) => setCoordinates((current) => ({ ...current, longitude: event.target.value }))} className="mt-1 w-full border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white" /></label></div><button type="button" onClick={locateMe} className="self-end border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"><MapPin className="mr-1 inline h-3.5 w-3.5" />Use my location</button></div>
          </>}
          <div className="space-y-2 border-t border-slate-800 pt-3"><label className="flex items-center gap-2 text-xs font-semibold text-slate-300"><input type="checkbox" checked={preferences.quietHours.enabled} onChange={(event) => setPref('quietHours', { ...preferences.quietHours, enabled: event.target.checked })} className="h-4 w-4 accent-cyan-300" />Quiet hours (critical alerts may still be sent)</label>{preferences.quietHours.enabled && <div className="grid grid-cols-2 gap-3"><label className="text-[11px] text-slate-400">Start<input type="time" value={preferences.quietHours.start} onChange={(event) => setPref('quietHours', { ...preferences.quietHours, start: event.target.value })} className="mt-1 w-full border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /></label><label className="text-[11px] text-slate-400">End<input type="time" value={preferences.quietHours.end} onChange={(event) => setPref('quietHours', { ...preferences.quietHours, end: event.target.value })} className="mt-1 w-full border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /></label></div>}</div>
          <button disabled={status.saving} className="min-h-10 w-full bg-emerald-700 px-4 text-xs font-bold text-white disabled:opacity-50">{status.saving ? 'Saving…' : 'Save alert preferences'}</button>
        </form>}
      </div>

      <div className="border border-slate-700/80 bg-slate-950/60 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-red-200">Private history</p><h3 className="mt-1 text-lg font-bold text-white">Recent alerts</h3></div><span className="text-[10px] text-slate-500">No phone details shown</span></div><div className="mt-3 divide-y divide-slate-800">{alerts.map((alert) => <article key={alert._id} className="py-3"><div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-semibold text-white">{alert.request?.title || 'Emergency request'}</h4><p className="mt-1 text-xs text-slate-400">{alert.request?.location} · {alert.request?.urgency}</p></div><span className={`text-[10px] font-bold uppercase ${alert.status === 'DELIVERED' ? 'text-emerald-300' : alert.status === 'MOCKED' ? 'text-amber-200' : 'text-slate-300'}`}>{alert.status === 'MOCKED' ? 'Not sent (development)' : alert.status}</span></div>{alert.request?.status && ['RESOLVED', 'CANCELLED'].includes(alert.request.status) ? <p className="mt-2 text-[11px] text-slate-500">Request {alert.request.status.toLowerCase()}</p> : alert.request && <div className="mt-2 flex flex-wrap gap-3"><Link to={`/requests/${alert.request._id}`} className="text-xs font-semibold text-cyan-200 underline">Open request</Link><button onClick={() => respond(alert.request._id, 'ACCEPTED')} className="text-xs font-semibold text-emerald-200 underline">I can help</button><button onClick={() => respond(alert.request._id, 'DECLINED')} className="text-xs text-slate-400 underline">Decline</button></div>}</article>)}{alerts.length === 0 && <p className="py-5 text-sm text-slate-400">No emergency alerts recorded.</p>}</div></div>
    </section>

    <section aria-labelledby="contacts-heading" className="border-y border-slate-700 py-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-red-200">Official services first</p><h2 id="contacts-heading" className="mt-1 text-lg font-bold text-white">Emergency contacts</h2><p className="mt-1 text-xs text-slate-400">ReliefGrid does not replace official emergency services.</p></div><a href="tel:112" className="inline-flex min-h-12 items-center justify-center gap-3 border border-red-400/40 bg-red-950/40 px-5 text-white"><PhoneCall className="h-5 w-5 text-red-200" /><span><span className="block text-[10px] uppercase tracking-wide text-red-200">National emergency</span><strong className="text-xl">112</strong></span></a></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">{contacts.slice(0, 5).map((contact) => <a key={contact.key} href={`tel:${contact.number}`} className="text-xs text-slate-300 underline decoration-slate-600 underline-offset-4">{contact.category}: {contact.number}</a>)}</div>{contactError && <p className="mt-2 text-[10px] text-amber-200">Using the built-in directory. State and regional availability may vary.</p>}<Link to="/emergency-contacts" className="mt-4 inline-block text-xs font-semibold text-cyan-200 underline">View all emergency contacts</Link></section>

    <section aria-labelledby="nearby-heading"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Local response</p><h2 id="nearby-heading" className="mt-1 text-xl font-bold text-white">Nearby help</h2><p className="mt-1 text-xs text-slate-400">{nearby.radiusKm ? `Within ${nearby.radiusKm} km of your private alert location` : 'Opt in and set an alert location to see nearby opportunities.'}</p></div><div className="grid gap-5 lg:grid-cols-2"><div><h3 className="mb-2 text-sm font-semibold text-slate-200">Open requests</h3><div className="divide-y divide-slate-800 border-y border-slate-800">{nearby.requests?.map((item) => <Link key={item._id} to={`/requests/${item._id}`} className="block py-3"><span className="text-sm font-semibold text-white">{item.title}</span><span className="mt-1 block text-xs text-slate-400">{item.location} · {item.urgency} · {item.status}</span></Link>)}{!nearby.requests?.length && <p className="py-4 text-xs text-slate-500">No nearby open requests were found.</p>}</div></div><div><h3 className="mb-2 text-sm font-semibold text-slate-200">Volunteer opportunities</h3><div className="divide-y divide-slate-800 border-y border-slate-800">{nearby.opportunities?.map((item) => <article key={item._id} className="py-3"><span className="text-sm font-semibold text-white">{item.title}</span><span className="mt-1 block text-xs text-slate-400">{item.location} · {item.category}</span></article>)}{!nearby.opportunities?.length && <p className="py-4 text-xs text-slate-500">No nearby opportunities were found.</p>}</div><Link to="/volunteer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-200 underline">Browse volunteer work <ArrowUpRight className="h-3 w-3" /></Link></div></div></section>
    </>}
  </div>
}
