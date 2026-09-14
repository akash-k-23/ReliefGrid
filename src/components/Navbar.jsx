import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import {
  ShieldAlert,
  HandHeart,
  Users,
  Compass,
  Gamepad2,
  LogIn,
  UserPlus,
  Menu,
  X,
  Radio,
  Home,
  AlertCircle
  ,Bell, Building2, ShieldCheck
} from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredPath, setHoveredPath] = useState(null)
  const location = useLocation()
  const { user, logout } = useAuth()

  const navLinks = user
    ? [
        { name: 'Home', path: '/home', icon: Home },
        { name: 'Request Help', path: '/request', icon: ShieldAlert, highlight: true },
        { name: 'Donate', path: '/donate', icon: HandHeart },
        { name: 'Volunteer', path: '/volunteer', icon: Users },
        { name: 'Explore Grid', path: '/explore', icon: Compass },
        { name: 'Awareness Game', path: '/game', icon: Gamepad2 },
        { name: 'Notifications', path: '/notifications', icon: Bell },
        ...(user.role === 'NGO' && user.verificationStatus === 'VERIFIED' ? [{ name: 'NGO Dashboard', path: '/ngo', icon: Building2 }] : []),
        ...(user.role === 'ADMIN' ? [{ name: 'Admin', path: '/admin', icon: ShieldCheck }] : []),
      ]
    : [{ name: 'Awareness Game', path: '/game', icon: Gamepad2 }]

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070b14]/85 backdrop-blur-xl transition-all">
      {/* Top Emergency Status Bar */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-cyan-950/40 border-b border-red-500/20 py-1 px-4 text-xs font-medium text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">
              Relief Grid Active
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">24/7 Humanitarian Coordination Network</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <Link
                to="/request"
                className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors text-[11px]"
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                Emergency Assistance Needed?
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with subtle breathing glow effect */}
          <Link to={user ? '/home' : '/'} className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-cyan-600 p-[1.5px] shadow-lg shadow-cyan-950/50"
            >
              <div className="w-full h-full bg-[#090d18] rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </motion.div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  RELIEF<span className="text-cyan-400 font-black">GRID</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight -mt-0.5">
                Connecting Help. Delivering Hope.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links with animated active indicator */}
          <nav
            className="hidden lg:flex items-center gap-1 xl:gap-1.5 relative p-1 rounded-xl bg-slate-950/40 border border-slate-800/60"
            onMouseLeave={() => setHoveredPath(null)}
          >
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.path)
              const isHovered = hoveredPath === link.path

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onMouseEnter={() => setHoveredPath(link.path)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors z-10 ${
                    active
                      ? 'text-cyan-300 font-bold'
                      : link.highlight
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {/* Sliding active indicator pill */}
                  {active && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 rounded-lg bg-slate-800 border border-slate-700/80 shadow-inner -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Subtle hover pill if not active */}
                  {isHovered && !active && (
                    <motion.div
                      layoutId="navbar-hover-pill"
                      className="absolute inset-0 rounded-lg bg-slate-800/50 -z-10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  <Icon
                    className={`w-4 h-4 transition-transform ${
                      active ? 'text-cyan-400 scale-110' : link.highlight ? 'text-red-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Desktop Right Actions: Login, Register, SOS */}
          <div className="hidden lg:flex items-center gap-3">
            {!user && <Link to="/login">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive('/login')
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-slate-400" />
                <span>Login</span>
              </motion.div>
            </Link>}

            {!user && <Link to="/register">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-950/50 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </motion.div>
            </Link>}

            {user && <>
              <Link to="/profile" className="text-xs font-semibold text-slate-300 hover:text-white">{user.name || user.organizationName}</Link>
              <button onClick={logout} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white">Logout</button>
            </>}

            {/* SOS Alert Button with calibrated emergency glow */}
            {user && <Link to="/request">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/60 transition-all overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                <span>SOS Alert</span>
              </motion.div>
            </Link>}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <Link
                to="/request"
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-600 text-white active:scale-95"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                SOS
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer with AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden border-t border-slate-800 bg-[#070b14]/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2 overflow-hidden"
          >
            {!user && <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200"
              >
                <LogIn className="w-4 h-4 text-slate-400" />
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-cyan-600 text-white"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </div>}

            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.path)
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-slate-800/90 text-cyan-400 border border-slate-700'
                        : link.highlight
                        ? 'text-red-400 bg-red-950/20 border border-red-500/20'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active ? 'text-cyan-400' : link.highlight ? 'text-red-400' : 'text-slate-400'
                      }`}
                    />
                    {link.name}
                  </Link>
                )
              })}
            </div>
            {user && <button onClick={() => { logout(); setIsOpen(false) }} className="w-full rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-300">Logout</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
