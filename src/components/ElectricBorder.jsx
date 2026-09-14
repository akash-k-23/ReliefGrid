import React from 'react'

/**
 * ElectricBorder component
 * Used selectively on high-priority emergency alerts or critical CTAs
 * Provides a crisp, glowing electric gradient outline without performance overhead.
 */
export default function ElectricBorder({
  children,
  className = '',
  color = 'red', // 'red' | 'cyan' | 'emerald' | 'amber'
}) {

  const gradientMap = {
    red: 'from-rose-500 via-amber-500 to-red-600',
    cyan: 'from-cyan-400 via-blue-500 to-teal-400',
    emerald: 'from-emerald-400 via-teal-500 to-green-500',
    amber: 'from-amber-400 via-orange-500 to-yellow-400',
  }

  const glowMap = {
    red: 'shadow-[0_0_20px_rgba(239,68,68,0.25)]',
    cyan: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
    emerald: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    amber: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  }

  const selectedGradient = gradientMap[color] || gradientMap.red
  const selectedGlow = glowMap[color] || glowMap.red

  return (
    <div className={`relative p-[1.5px] rounded-2xl bg-gradient-to-r ${selectedGradient} ${selectedGlow} transition-all duration-300 ${className}`}>
      <div className="relative h-full w-full rounded-[calc(1rem-1.5px)] bg-slate-950/90 backdrop-blur-xl">
        {children}
      </div>
    </div>
  )
}
