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
        className={`pointer-events-none fixed inset-x-4 bottom-4 z-30 hidden max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-left shadow-[0_18px_40px_rgba(54,6,77,0.16)] group-hover:block group-focus-within:block sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-7 sm:z-20 sm:max-h-none sm:w-72 sm:overflow-visible ${
          align === 'right' ? 'sm:right-0' : 'sm:left-0'
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
