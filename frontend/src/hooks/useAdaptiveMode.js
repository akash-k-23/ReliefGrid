import { useEffect, useState } from 'react'

function getMode() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const slowConnection = connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType)

  if (reducedMotion) return 'reduced-motion'
  if (slowConnection || !navigator.onLine) return 'low-bandwidth'
  return 'full'
}

export function useAdaptiveMode() {
  const [mode, setMode] = useState(() => getMode())

  useEffect(() => {
    const update = () => setMode(getMode())
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    mediaQuery.addEventListener?.('change', update)
    connection?.addEventListener?.('change', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      mediaQuery.removeEventListener?.('change', update)
      connection?.removeEventListener?.('change', update)
    }
  }, [])

  return {
    mode,
    isLowBandwidth: mode === 'low-bandwidth',
    isReducedMotion: mode === 'reduced-motion',
    isFullExperience: mode === 'full',
  }
}
