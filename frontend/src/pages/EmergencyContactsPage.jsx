import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpRight, PhoneCall, Search, ShieldAlert } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { emergencyContactsFallback } from '../data/emergencyContacts'

const categories = ['All', ...new Set(emergencyContactsFallback.map((contact) => contact.category))]

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState(emergencyContactsFallback)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 3500)
    apiFetch('/emergency/contacts', { signal: controller.signal })
      .then((result) => {
        if (Array.isArray(result.data) && result.data.length) {
          setContacts(result.data)
          setIsOffline(false)
        }
      })
      .catch(() => setIsOffline(true))
      .finally(() => window.clearTimeout(timeout))
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  const filteredContacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return contacts.filter((contact) => (category === 'All' || contact.category === category)
      && (!normalizedQuery || [contact.name, contact.number, contact.category, contact.availability, contact.notes].some((value) => value?.toLowerCase().includes(normalizedQuery))))
      .sort((first, second) => Number(second.number === '112') - Number(first.number === '112'))
  }, [category, contacts, query])

  return (
    <div className="mx-auto min-h-[calc(100vh-12rem)] w-full max-w-6xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-slate-700/80 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-red-300"><ShieldAlert className="h-4 w-4" /> India emergency directory</div>
        <h1 className="mt-3 text-3xl font-black text-white">Emergency contacts</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">ReliefGrid does not replace official emergency services. If someone is in immediate danger, call 112 or your local emergency service.</p>
      </header>

      <a href="tel:112" className="flex flex-col gap-4 border border-red-400/40 bg-red-950/45 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-label="Call national emergency number 112">
        <div className="flex items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center bg-red-500/15 text-red-200"><PhoneCall className="h-6 w-6" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-200">Immediate danger</p><h2 className="mt-1 text-lg font-bold text-white">National Emergency Number</h2></div></div>
        <span className="flex items-center gap-2 text-2xl font-black text-white">Call 112 <ArrowUpRight className="h-5 w-5" /></span>
      </a>

      {isOffline && <p className="flex gap-2 border border-amber-300/30 bg-amber-950/25 p-3 text-xs text-amber-100"><AlertTriangle className="h-4 w-4 shrink-0" />Using the built-in offline directory. Number coverage can vary by state/UT; confirm local availability when possible.</p>}
      <section aria-label="Search emergency contacts" className="space-y-4">
        <label className="flex items-center gap-3 border border-slate-700 bg-slate-950/80 px-4 py-3"><Search className="h-4 w-4 shrink-0 text-cyan-300" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Search service, number, or region note" /></label>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by service type">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`shrink-0 border px-3 py-2 text-xs font-semibold transition ${category === item ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-slate-700 text-slate-400 hover:text-white'}`}>{item}</button>)}</div>
      </section>

      <section className="divide-y divide-slate-800 border-y border-slate-800" aria-live="polite">
        {filteredContacts.map((contact) => <article key={contact.key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-white">{contact.name}</h2><span className="border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">{contact.category}</span>{contact.isNational && <span className="text-[10px] font-semibold text-emerald-300">National</span>}</div><p className="mt-1 text-xs leading-5 text-slate-400">{contact.availability}</p>{contact.notes && <p className="mt-1 text-xs text-slate-500">{contact.notes}</p>}</div>
          <a href={`tel:${contact.number}`} aria-label={`Call ${contact.name} at ${contact.number}`} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-slate-700 px-4 text-sm font-bold text-cyan-100 hover:border-cyan-300"><PhoneCall className="h-4 w-4" />Call {contact.number}</a>
        </article>)}
        {filteredContacts.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No contacts match that search.</p>}
      </section>

      <p className="text-xs leading-5 text-slate-500">Helpline availability and scope may change. State and district disaster-control numbers are locally operated. This directory is maintained by ReliefGrid and is not an official government service.</p>
    </div>
  )
}
