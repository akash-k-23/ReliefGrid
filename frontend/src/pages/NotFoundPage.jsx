import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-5">
        <Compass className="mx-auto h-10 w-10 text-cyan-400" aria-hidden="true" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">404</p>
          <h1 className="mt-2 text-3xl font-black text-white">Page not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">That ReliefGrid destination does not exist or may have moved.</p>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-500">
          <ArrowLeft className="h-4 w-4" />
          Return to ReliefGrid
        </Link>
      </div>
    </div>
  )
}
