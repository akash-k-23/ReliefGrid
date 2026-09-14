import { useEffect, useState } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'
import { apiFetch } from '../lib/api'

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = () => apiFetch('/notifications').then((data) => setItems(data.data)).catch((err) => setError(err.message)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])
  const markAll = async () => { await apiFetch('/notifications/read-all', { method: 'PATCH' }); load() }
  const markRead = async (id) => { await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }); load() }
  return <div className="mx-auto min-h-[calc(100vh-12rem)] max-w-3xl space-y-6 px-4 py-10 sm:px-6 lg:px-8"><header className="flex items-end justify-between gap-4"><div><Bell className="h-7 w-7 text-cyan-400" /><h1 className="mt-3 text-3xl font-black text-white">Notifications</h1></div><button type="button" onClick={markAll} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300">Mark all read</button></header>{error && <p className="rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}{loading ? <Loader2 className="h-5 w-5 animate-spin text-cyan-400" /> : items.length === 0 ? <p className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-400">No notifications yet.</p> : <div className="space-y-3">{items.map((item) => <button type="button" onClick={() => markRead(item._id)} key={item._id} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left ${item.readAt ? 'border-slate-800 bg-slate-900/50' : 'border-cyan-500/40 bg-cyan-950/20'}`}><Check className="mt-0.5 h-4 w-4 text-cyan-400" /><span><strong className="block text-sm text-white">{item.type.replaceAll('_', ' ')}</strong><span className="mt-1 block text-xs text-slate-400">{item.message}</span></span></button>)}</div>}</div>
}
