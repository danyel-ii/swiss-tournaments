import type { ReactNode } from 'react'

interface HelpTooltipProps {
  label: string
  title: string
  children: ReactNode
  align?: 'left' | 'right'
}

export function HelpTooltip({
  label,
  title,
  children,
  align = 'left',
}: HelpTooltipProps) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-900/20 bg-amber-50 text-[11px] font-display font-bold text-emerald-800 transition hover:border-emerald-700/40 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400/35"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-7 z-20 hidden w-72 rounded-[22px] border border-emerald-900/15 bg-[#fff8df] p-4 text-left shadow-[0_18px_34px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        <span className="font-display block text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-700">
          {title}
        </span>
        <span className="font-data mt-2 block text-sm leading-6 text-slate-700">
          {children}
        </span>
      </span>
    </span>
  )
}
