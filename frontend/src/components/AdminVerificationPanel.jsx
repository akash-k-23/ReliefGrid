import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react'
import { apiFetch } from '../lib/api'

export default function AdminVerificationPanel() {
  const [donations, setDonations] = useState([])
  const [applications, setApplications] = useState([])
  const [users, setUsers] = useState([])
  const [hours, setHours] = useState({})
  const [state, setState] = useState({ busy: '', message: '', error: '' })

  const load = async () => {
    const result = await Promise.allSettled([apiFetch('/donations'), apiFetch('/admin/applications'), apiFetch('/admin/users')])
    if (result[0].status === 'fulfilled') setDonations(result[0].value.data || [])
    if (result[1].status === 'fulfilled') setApplications(result[1].value.data || [])
    if (result[2].status === 'fulfilled') setUsers(result[2].value.data || [])
    const failure = result.find((item) => item.status === 'rejected')
    if (failure) setState((current) => ({ ...current, error: failure.reason.message }))
  }

  useEffect(() => { load() }, [])

  const updateDonation = async (donation) => {
    const nextStatus = donation.status === 'PLEDGED' ? 'RECEIVED' : 'ALLOCATED'
    setState({ busy: donation._id, message: '', error: '' })
    try {
      await apiFetch(`/donations/${donation._id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) })
      setState({ busy: '', message: `Donation marked ${nextStatus.toLowerCase()}.`, error: '' })
      await load()
    } catch (error) {
      setState({ busy: '', message: '', error: error.message })
    }
  }

  const completeActivity = async (application) => {
    setState({ busy: application._id, message: '', error: '' })
    try {
      await apiFetch(`/opportunities/applications/${application._id}`, { method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED', verifiedHours: Number(hours[application._id] ?? application.verifiedHours ?? 0) }) })
      setState({ busy: '', message: 'Activity completion and verified hours recorded.', error: '' })
      await load()
    } catch (error) {
      setState({ busy: '', message: '', error: error.message })
    }
  }

  const setAccountStatus = async (userId, verificationStatus) => {
    setState({ busy: userId, message: '', error: '' })
    try {
      await apiFetch(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ verificationStatus }) })
      setState({ busy: '', message: 'Account status updated. Suspension disables emergency SMS.', error: '' })
      await load()
    } catch (error) {
      setState({ busy: '', message: '', error: error.message })
    }
  }

  return <section className="mx-auto w-full max-w-7xl space-y-7 px-4 sm:px-6 lg:px-8" aria-label="Verification and account controls">
    <header className="border-t border-slate-700 pt-7"><span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Verification controls</span><h2 className="mt-1 text-xl font-bold text-white">Contributions and account safety</h2></header>
    {state.message && <p role="status" className="flex gap-2 border border-emerald-400/30 bg-emerald-950/30 p-3 text-xs text-emerald-100"><CheckCircle2 className="h-4 w-4" />{state.message}</p>}
    {state.error && <p role="alert" className="border border-red-400/30 bg-red-950/30 p-3 text-xs text-red-100">{state.error}</p>}
    <div className="grid gap-7 lg:grid-cols-2"><section><h3 className="mb-3 text-sm font-bold text-white">Donation verification</h3><div className="divide-y divide-slate-800 border-y border-slate-800">{donations.map((donation) => <article key={donation._id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><h4 className="text-sm font-semibold text-white">{donation.item}</h4><p className="mt-1 text-xs text-slate-400">{donation.donor?.name || 'Donor'} · {donation.request?.title || 'Request'} · {donation.quantity}</p><p className="mt-1 text-[10px] text-slate-500">{donation.status}</p></div>{donation.status !== 'CANCELLED' && donation.status !== 'ALLOCATED' && <button disabled={state.busy === donation._id} onClick={() => updateDonation(donation)} className="min-h-9 border border-emerald-300/30 px-3 text-xs font-semibold text-emerald-100 disabled:opacity-50">{state.busy === donation._id ? <Loader2 className="h-4 w-4 animate-spin" /> : donation.status === 'PLEDGED' ? 'Verify received' : 'Mark allocated'}</button>}</article>)}{donations.length === 0 && <p className="py-4 text-xs text-slate-500">No contribution records.</p>}</div></section>
      <section><h3 className="mb-3 text-sm font-bold text-white">Volunteer activity verification</h3><div className="divide-y divide-slate-800 border-y border-slate-800">{applications.map((application) => <article key={application._id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><h4 className="text-sm font-semibold text-white">{application.opportunity?.title || 'Volunteer activity'}</h4><p className="mt-1 text-xs text-slate-400">{application.volunteer?.name || 'Volunteer'} · {application.status}{application.hoursVerifiedAt ? ` · ${application.verifiedHours} hours verified` : ''}</p></div>{['APPROVED', 'COMPLETED'].includes(application.status) && <div className="flex items-center gap-2"><label className="text-[10px] text-slate-400">Hours<input type="number" min="0" max="24" step="0.25" value={hours[application._id] ?? application.verifiedHours ?? 0} onChange={(event) => setHours({ ...hours, [application._id]: event.target.value })} className="mt-1 block w-20 border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white" /></label><button disabled={state.busy === application._id} onClick={() => completeActivity(application)} className="mt-4 min-h-9 border border-emerald-300/30 px-3 text-xs font-semibold text-emerald-100 disabled:opacity-50">{state.busy === application._id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify complete'}</button></div>}</article>)}{applications.length === 0 && <p className="py-4 text-xs text-slate-500">No volunteer applications.</p>}</div></section></div>
    <section><h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><ShieldAlert className="h-4 w-4 text-red-200" />Account restrictions</h3><div className="divide-y divide-slate-800 border-y border-slate-800">{users.filter((user) => user.role !== 'ADMIN').map((user) => <div key={user._id} className="flex flex-wrap items-center justify-between gap-3 py-2"><span className="text-xs text-slate-300">{user.name || user.organizationName} · {user.role}</span><select aria-label={`Account status for ${user.name || user.organizationName}`} value={user.verificationStatus} onChange={(event) => setAccountStatus(user._id, event.target.value)} className="border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white"><option>PENDING</option><option>VERIFIED</option><option>REJECTED</option><option>SUSPENDED</option></select></div>)}</div></section>
  </section>
}
