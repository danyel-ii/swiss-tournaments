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
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-display font-bold text-sky-600 transition hover:border-sky-200 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-7 z-20 hidden w-72 rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.08)] group-hover:block group-focus-within:block ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        <span className="font-display block text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-600">
          {title}
        </span>
        <span className="font-data mt-2 block text-sm leading-6 text-slate-600">
          {children}
        </span>
      </span>
    </span>
  )
}
