import { useEffect, useState } from 'react'
import { Activity, CheckCircle2, Loader2, Plus, RefreshCw, Save } from 'lucide-react'
import { apiFetch } from '../lib/api'

const emptyContact = { key: '', name: '', number: '', category: '', availability: '', notes: '', isNational: false, enabled: true }

export default function EmergencyAdminPanel() {
  const [alerts, setAlerts] = useState([])
  const [responses, setResponses] = useState([])
  const [contacts, setContacts] = useState([])
  const [users, setUsers] = useState([])
  const [audit, setAudit] = useState([])
  const [reports, setReports] = useState([])
  const [reportNotes, setReportNotes] = useState({})
  const [draft, setDraft] = useState(emptyContact)
  const [edits, setEdits] = useState({})
  const [state, setState] = useState({ busy: '', message: '', error: '' })

  const load = async () => {
    const results = await Promise.allSettled([
      apiFetch('/admin/emergency-alerts'),
      apiFetch('/admin/emergency-contacts'),
      apiFetch('/admin/emergency-contacts/audit'),
      apiFetch('/admin/users'),
      apiFetch('/admin/emergency-reports'),
    ])
    if (results[0].status === 'fulfilled') {
      setAlerts(results[0].value.data.alerts || [])
      setResponses(results[0].value.data.responses || [])
    }
    if (results[1].status === 'fulfilled') setContacts(results[1].value.data || [])
    if (results[2].status === 'fulfilled') setAudit(results[2].value.data || [])
    if (results[3].status === 'fulfilled') setUsers(results[3].value.data || [])
    if (results[4].status === 'fulfilled') setReports(results[4].value.data || [])
    const failure = results.find((result) => result.status === 'rejected')
    if (failure) setState((current) => ({ ...current, error: failure.reason.message }))
  }

  useEffect(() => { load() }, [])

  const createContact = async (event) => {
    event.preventDefault()
    setState({ busy: 'create-contact', message: '', error: '' })
    try {
      await apiFetch('/admin/emergency-contacts', { method: 'POST', body: JSON.stringify(draft) })
      setDraft(emptyContact)
      setState({ busy: '', message: 'Emergency contact added.', error: '' })
      await load()
    } catch (error) {
      setState({ busy: '', message: '', error: error.message })
    }
  }

  const saveContact = async (contact) => {
    const values = edits[contact.key] || contact
    setState({ busy: contact.key, message: '', error: '' })
    try {
      await apiFetch(`/admin/emergency-contacts/${contact.key}`, { method: 'PATCH', body: JSON.stringify(values) })
      setState({ busy: '', message: 'Contact updated and audit recorded.', error: '' })
      await load()
    } catch (error) {
      setState({ busy: '', message: '', error: error.message })
    }
  }

  const reviewReport = async (reportId, status) => {
    setState({ busy: reportId, message: '', error: '' })
    try {
      await apiFetch(`/admin/emergency-reports/${reportId}`, { method: 'PATCH', body: JSON.stringify({ status, reviewNotes: reportNotes[reportId] || '' }) })
      setState({ busy: '', message: 'Report review saved.', error: '' })
      await load()
    } catch (error) {
      setState({ busy: '', message: '', error: error.message })
    }
  }

  const recalculate = async (userId) => {
    setState({ busy: userId, message: '', error: '' })
    try {
      await apiFetch(`/admin/users/${userId}/recalculate-achievements`, { method: 'POST', body: JSON.stringify({}) })
      setState({ busy: '', message: 'Achievements recalculated and audited.', error: '' })
      await load()
    } catch (error) {
      setState({ busy: '', message: '', error: error.message })
    }
  }

  return <div className="space-y-8 border-t border-slate-700 pt-8">
    <header><span className="text-xs font-bold uppercase tracking-[0.18em] text-red-200">Emergency operations</span><h2 className="mt-1 text-xl font-bold text-white">Alerts and contact directory</h2></header>
    {state.message && <p role="status" className="flex gap-2 border border-emerald-400/30 bg-emerald-950/30 p-3 text-xs text-emerald-100"><CheckCircle2 className="h-4 w-4" />{state.message}</p>}
    {state.error && <p role="alert" className="border border-red-400/30 bg-red-950/30 p-3 text-xs text-red-100">{state.error}</p>}

    <section><div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-red-200" /><h3 className="text-sm font-bold text-white">SMS alert activity</h3></div><div className="overflow-x-auto border-y border-slate-800"><table className="w-full min-w-[680px] text-left text-xs"><thead className="text-slate-400"><tr><th className="py-3 pr-3">Request / recipient</th><th className="py-3 pr-3">Status</th><th className="py-3 pr-3">Attempts</th><th className="py-3 pr-3">Request status</th><th className="py-3">Error</th></tr></thead><tbody className="divide-y divide-slate-800">{alerts.map((alert) => <tr key={alert._id}><td className="py-3 pr-3 text-slate-200">{alert.request?.title || 'Removed request'}<span className="block text-slate-500">{alert.recipient?.name || 'User'} · {alert.provider}</span></td><td className="py-3 pr-3 font-semibold text-cyan-100">{alert.status}</td><td className="py-3 pr-3 text-slate-300">{alert.attempts}</td><td className="py-3 pr-3 text-slate-300">{alert.request?.status || 'Unavailable'}</td><td className="max-w-64 py-3 text-amber-100">{alert.lastError || '—'}</td></tr>)}{alerts.length === 0 && <tr><td colSpan="5" className="py-5 text-slate-400">No SMS alerts recorded.</td></tr>}</tbody></table></div>
      <h4 className="mt-4 text-xs font-semibold text-slate-300">Recipient responses</h4><div className="mt-2 divide-y divide-slate-800">{responses.map((response) => <div key={response._id} className="flex flex-wrap justify-between gap-2 py-2 text-xs"><span className="text-slate-300">{response.recipient?.name || 'User'} · {response.request?.title || 'Request'}</span><span className="font-semibold text-emerald-200">{response.response}</span></div>)}{responses.length === 0 && <p className="py-2 text-xs text-slate-500">No responses recorded.</p>}</div>
    </section>

    <section><h3 className="mb-3 text-sm font-bold text-white">Abuse reports</h3><div className="divide-y divide-slate-800 border-y border-slate-800">{reports.map((report) => <article key={report._id} className="py-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="text-xs font-bold text-white">{report.reason} · {report.targetType} · {report.status}</h4><p className="mt-1 text-xs text-slate-300">{report.targetRequest?.title || report.targetUser?.name || report.targetAlert?.request || 'Reported item'}</p><p className="mt-1 text-[11px] text-slate-500">Reported by {report.reporter?.name || 'User'} · {new Date(report.createdAt).toLocaleString()}</p><p className="mt-2 text-xs text-slate-400">{report.details || 'No additional details.'}</p></div>{report.status === 'OPEN' && <div className="flex gap-2"><button onClick={() => reviewReport(report._id, 'REVIEWED')} disabled={state.busy === report._id} className="border border-emerald-300/30 px-3 py-2 text-[10px] font-semibold text-emerald-100">Review</button><button onClick={() => reviewReport(report._id, 'DISMISSED')} disabled={state.busy === report._id} className="border border-slate-700 px-3 py-2 text-[10px] font-semibold text-slate-300">Dismiss</button></div>}</div>{report.status === 'OPEN' && <input maxLength={1000} value={reportNotes[report._id] || ''} onChange={(event) => setReportNotes({ ...reportNotes, [report._id]: event.target.value })} placeholder="Optional review note" className="mt-3 w-full border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white" />}</article>)}{reports.length === 0 && <p className="py-4 text-xs text-slate-500">No reports submitted.</p>}</div></section>

    <section><h3 className="mb-3 text-sm font-bold text-white">Manage emergency contacts</h3><form onSubmit={createContact} className="grid gap-2 border border-slate-800 bg-slate-950/50 p-4 sm:grid-cols-2"><input required pattern="[a-z0-9-]{3,80}" title="Use lowercase letters, numbers, and hyphens" placeholder="contact-key" value={draft.key} onChange={(event) => setDraft({ ...draft, key: event.target.value })} className="border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /><input required placeholder="Service name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /><input required pattern="[+]?[0-9]{2,10}" placeholder="Phone number" value={draft.number} onChange={(event) => setDraft({ ...draft, number: event.target.value })} className="border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /><input required placeholder="Category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /><input required placeholder="Availability / region" value={draft.availability} onChange={(event) => setDraft({ ...draft, availability: event.target.value })} className="border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white sm:col-span-2" /><textarea placeholder="Notes" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white sm:col-span-2" /><label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={draft.isNational} onChange={(event) => setDraft({ ...draft, isNational: event.target.checked })} />National coverage</label><button disabled={state.busy === 'create-contact'} className="flex min-h-9 items-center justify-center gap-2 bg-cyan-700 px-3 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" />Add contact</button></form>
      <div className="mt-3 divide-y divide-slate-800 border-y border-slate-800">{contacts.map((contact) => { const value = edits[contact.key] || contact; return <div key={contact.key} className="grid gap-2 py-3 sm:grid-cols-[1fr_1fr_auto]"><div><p className="text-xs font-semibold text-white">{contact.key}</p><p className="mt-1 text-[10px] text-slate-500">{contact.isNational ? 'National' : 'Regional'} · {contact.enabled ? 'Published' : 'Disabled'}</p></div><div className="grid grid-cols-2 gap-2"><input aria-label={`${contact.key} service name`} value={value.name} onChange={(event) => setEdits({ ...edits, [contact.key]: { ...value, name: event.target.value } })} className="border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-white" /><input aria-label={`${contact.key} phone`} value={value.number} onChange={(event) => setEdits({ ...edits, [contact.key]: { ...value, number: event.target.value } })} className="border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-white" /><input aria-label={`${contact.key} category`} value={value.category} onChange={(event) => setEdits({ ...edits, [contact.key]: { ...value, category: event.target.value } })} className="border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-white" /><input aria-label={`${contact.key} availability`} value={value.availability} onChange={(event) => setEdits({ ...edits, [contact.key]: { ...value, availability: event.target.value } })} className="border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-white" /></div><div className="flex items-center gap-2"><label className="flex items-center gap-1 text-[10px] text-slate-400"><input type="checkbox" checked={value.enabled} onChange={(event) => setEdits({ ...edits, [contact.key]: { ...value, enabled: event.target.checked } })} />Published</label><button onClick={() => saveContact(contact)} disabled={state.busy === contact.key} aria-label={`Save ${contact.name}`} className="flex h-9 w-9 items-center justify-center border border-slate-700 text-cyan-100 disabled:opacity-50">{state.busy === contact.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</button></div></div> })}</div>
      <h4 className="mt-4 text-xs font-semibold text-slate-300">Contact change audit</h4><div className="mt-2 divide-y divide-slate-800">{audit.slice(0, 10).map((entry) => <p key={entry._id} className="py-2 text-[11px] text-slate-400">{entry.action} · {entry.key} · {entry.performedBy?.name || 'Admin'} · {new Date(entry.createdAt).toLocaleString()}</p>)}</div>
    </section>

    <section><div className="mb-3 flex items-center gap-2"><RefreshCw className="h-4 w-4 text-amber-200" /><h3 className="text-sm font-bold text-white">Recalculate user achievements</h3></div><div className="divide-y divide-slate-800 border-y border-slate-800">{users.filter((user) => user.role !== 'ADMIN').map((user) => <div key={user._id} className="flex flex-wrap items-center justify-between gap-3 py-2"><span className="text-xs text-slate-300">{user.name || user.organizationName} · {user.role}</span><button onClick={() => recalculate(user._id)} disabled={state.busy === user._id} className="border border-slate-700 px-3 py-2 text-[10px] font-semibold text-amber-100 disabled:opacity-50">Recalculate</button></div>)}</div></section>
  </div>
}
