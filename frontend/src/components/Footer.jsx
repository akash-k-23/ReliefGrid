import { Link } from 'react-router-dom'
import { Radio, PhoneCall } from 'lucide-react'


export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-[#050810] text-slate-400 text-sm">
      {/* Emergency Hotlines Strip */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <PhoneCall className="w-4 h-4 text-red-400 animate-pulse" />
            <span>Emergency Helplines (India):</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-red-300 font-mono">
              National Emergency: <strong className="text-white">112</strong>
            </span>
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-amber-300 font-mono">
              NDMA Disaster Helpline: <strong className="text-white">1078</strong>
            </span>
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-cyan-300 font-mono">
              Ambulance: <strong className="text-white">108</strong>
            </span>
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-emerald-300 font-mono">
              Fire & Rescue: <strong className="text-white">101</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-cyan-600 p-[1px]">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Radio className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-extrabold text-lg tracking-wider text-white">
                RELIEF<span className="text-cyan-400">GRID</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A real-time humanitarian emergency relief coordination platform bridging victims, registered NGOs, active volunteers, and resource donors during critical crisis windows.
            </p>
            <div className="pt-2 text-xs font-medium text-cyan-400/80">
              Tagline: &quot;Connecting Help. Delivering Hope.&quot;
            </div>
          </div>

          {/* Core Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Platform Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/home" className="hover:text-cyan-400 transition-colors">
                  Dashboard Overview
                </Link>
              </li>
              <li>
                <Link to="/request" className="text-red-400 hover:text-red-300 transition-colors font-medium">
                  Request Emergency Help (SOS)
                </Link>
              </li>
              <li>
                <Link to="/donate" className="hover:text-cyan-400 transition-colors">
                  Contribute Supplies & Resources
                </Link>
              </li>
              <li>
                <Link to="/volunteer" className="hover:text-cyan-400 transition-colors">
                  Volunteer Mobilization
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-cyan-400 transition-colors">
                  Explore Relief Map & Activity
                </Link>
              </li>
              <li>
                <Link to="/locations" className="hover:text-emerald-400 transition-colors">
                  Location Tracer (Demo)
                </Link>
              </li>
              <li>
                <Link to="/game" className="hover:text-cyan-400 transition-colors">
                  Disaster Preparedness Game
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Coordination */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Coordination & Access
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-cyan-400 transition-colors">
                  Responder & Citizen Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-cyan-400 transition-colors">
                  Register Individual / Volunteer
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-cyan-400 transition-colors text-emerald-400">
                  Register NGO / Organization
                </Link>
              </li>
            </ul>
          </div>

          {/* Mission & Academic Note */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Humanitarian Mission
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Engineered as an open-source, non-commercial emergency response system. Designed for rapid deployment during floods, earthquakes, cyclones, and humanitarian emergencies.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} RELIEFGRID Project. All rights reserved. Connecting Help, Delivering Hope.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>React + Vite</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Motion</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono">Open-Source</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
