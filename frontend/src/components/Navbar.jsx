import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'
import { AlertCircle, Bell, Building2, Compass, Gamepad2, HandHeart, Home, LocateFixed, LogIn, Menu, Radio, ShieldAlert, ShieldCheck, UserPlus, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const baseLinks = [
  { name: 'Home', path: '/home', icon: Home },
  { name: 'Request Help', path: '/request', icon: ShieldAlert, highlight: true },
  { name: 'Donate', path: '/donate', icon: HandHeart },
  { name: 'Volunteer', path: '/volunteer', icon: Users },
  { name: 'Explore Grid', path: '/explore', icon: Compass },
  { name: 'Location Tracer', path: '/locations', icon: LocateFixed },
  { name: 'Awareness Game', path: '/game', icon: Gamepad2 },
  { name: 'Notifications', path: '/notifications', icon: Bell, badge: 3 },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()
  const navLinks = user ? [...baseLinks, ...(user.role === 'NGO' && user.verificationStatus === 'VERIFIED' ? [{ name: 'NGO Dashboard', path: '/ngo', icon: Building2 }] : []), ...(user.role === 'ADMIN' ? [{ name: 'Admin', path: '/admin', icon: ShieldCheck }] : [])] : []
  const isActive = (path) => location.pathname === path

  const renderLinks = () => navLinks.map((link) => {
    const Icon = link.icon
    const active = isActive(link.path)
    return <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${active ? 'bg-cyan-400/12 text-cyan-300' : link.highlight ? 'text-red-300 hover:bg-red-500/10 hover:text-red-200' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'}`}>
      {active && <motion.span layoutId="sidebar-active" className="absolute left-0 h-7 w-1 rounded-r-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,.9)]" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
      <motion.span whileHover={{ x: 3, rotate: link.highlight ? -4 : 0 }} className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900/80"><Icon className={`h-4 w-4 ${active ? 'text-cyan-300' : link.highlight ? 'text-red-300' : 'text-slate-500 group-hover:text-cyan-300'}`} />{link.badge && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white animate-pulse">{link.badge}</span>}</motion.span>
      <span className="truncate">{link.name}</span>{link.highlight && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,.9)]" />}
    </Link>
  })

  return <>
    {!user && <div className="fixed right-6 top-6 z-[60] hidden items-center gap-3 lg:flex"><Link to="/login" className="group flex items-center gap-2 rounded-xl border border-slate-600/80 bg-[#070b14]/85 px-5 py-3 text-sm font-bold text-slate-200 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-cyan-400 hover:text-white hover:shadow-cyan-950/50"><LogIn className="h-4 w-4 text-cyan-300 transition-transform group-hover:-translate-x-1" /> Login</Link><Link to="/register" className="group flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-950/40 transition-all hover:-translate-y-1 hover:bg-cyan-300 hover:shadow-cyan-400/30"><UserPlus className="h-4 w-4 transition-transform group-hover:scale-110" /> Register</Link></div>}
    <aside className={`${user ? 'lg:flex' : 'hidden'} fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-slate-800/90 bg-[#070b14]/92 px-4 py-5 shadow-2xl shadow-black/30 backdrop-blur-2xl`}>
      <Link to={user ? '/home' : '/'} className="mb-8 flex items-center gap-3 px-2"><motion.div whileHover={{ scale: 1.06, rotate: 5 }} className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 via-cyan-500 to-blue-500 p-[1.5px] shadow-lg shadow-cyan-950/60"><div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#090d18]"><Radio className="h-5 w-5 text-cyan-300 animate-pulse" /></div></motion.div><div><div className="text-lg font-black tracking-widest text-white">RELIEF<span className="text-cyan-400">GRID</span></div><div className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">Response network</div></div></Link>
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Network active</div>
      <div className="min-h-0 flex-1 overflow-y-auto">{user ? <nav className="space-y-1" aria-label="Primary navigation">{renderLinks()}</nav> : <div className="space-y-2"><Link to="/login" className="flex items-center gap-3 rounded-xl border border-slate-700 px-3 py-3 text-sm font-semibold text-slate-300 hover:border-cyan-400"><LogIn className="h-4 w-4" /> Login</Link><Link to="/register" className="flex items-center gap-3 rounded-xl bg-cyan-600 px-3 py-3 text-sm font-bold text-white hover:bg-cyan-500"><UserPlus className="h-4 w-4" /> Register</Link></div>}</div>
      {user && <div className="mt-5 border-t border-slate-800 pt-4"><Link to="/profile" className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-800/70"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-slate-950">{(user.name || user.organizationName || 'R').slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-white">{user.name || user.organizationName}</strong><span className="text-[10px] uppercase tracking-widest text-slate-500">{user.role}</span></span></Link><button onClick={logout} className="mt-2 w-full rounded-lg border border-slate-800 py-2 text-xs font-semibold text-slate-400 hover:border-red-400/40 hover:text-red-300">Sign out</button></div>}
    </aside>
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-800/90 bg-[#070b14]/90 px-4 backdrop-blur-xl lg:hidden"><Link to={user ? '/home' : '/'} className="flex items-center gap-2"><Radio className="h-5 w-5 text-cyan-400" /><span className="font-black tracking-widest text-white">RELIEF<span className="text-cyan-400">GRID</span></span></Link><div className="flex items-center gap-2">{!user && <><Link to="/login" className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200">Login</Link><Link to="/register" className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-black text-slate-950">Register</Link></>}{user && <Link to="/request" className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white"><AlertCircle className="h-3.5 w-3.5" /> SOS</Link>}<button onClick={() => setIsOpen((value) => !value)} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800" aria-label="Toggle navigation">{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div></header>
    <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="fixed inset-x-0 top-16 z-40 overflow-hidden border-b border-slate-800 bg-[#070b14]/98 p-4 shadow-2xl backdrop-blur-2xl lg:hidden">{user ? <nav className="space-y-1" aria-label="Mobile navigation">{renderLinks()}</nav> : <div className="grid grid-cols-2 gap-2"><Link to="/login" onClick={() => setIsOpen(false)} className="rounded-xl border border-slate-700 p-3 text-center text-sm font-semibold text-slate-200">Login</Link><Link to="/register" onClick={() => setIsOpen(false)} className="rounded-xl bg-cyan-600 p-3 text-center text-sm font-bold text-white">Register</Link></div>}</motion.div>}</AnimatePresence>
+  </>
}
