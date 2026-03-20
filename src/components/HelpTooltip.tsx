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
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[11px] font-display font-bold text-[var(--theme-red)] transition hover:border-[var(--theme-aqua)] hover:text-[var(--theme-plum)] focus:outline-none focus:ring-2 focus:ring-[rgba(118,210,219,0.22)]"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-7 z-20 hidden w-72 rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-left shadow-[0_18px_40px_rgba(54,6,77,0.16)] group-hover:block group-focus-within:block ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        <span className="font-display block text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--theme-red)]">
          {title}
        </span>
        <span className="font-data mt-2 block text-sm leading-6 text-[var(--theme-text-soft)]">
          {children}
        </span>
      </span>
    </span>
  )
}
