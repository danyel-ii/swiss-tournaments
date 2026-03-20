import { useI18n } from '../useI18n'

interface ViewTabsProps {
  activeView: 'dashboard' | 'standings'
  onSelectView: (view: 'dashboard' | 'standings') => void
}

export function ViewTabs({ activeView, onSelectView }: ViewTabsProps) {
  const { t } = useI18n()

  return (
    <section className="theme-panel rounded-3xl p-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelectView('dashboard')}
          className={`rounded-2xl px-4 py-3 font-display text-sm font-semibold transition ${
            activeView === 'dashboard'
              ? 'bg-[var(--theme-plum)] text-[var(--theme-cream)]'
              : 'bg-[var(--theme-surface)] text-[var(--theme-text-soft)] hover:bg-[var(--theme-aqua-soft)] hover:text-[var(--theme-plum)]'
          }`}
        >
          {t.navigation.dashboard}
        </button>
        <button
          type="button"
          onClick={() => onSelectView('standings')}
          className={`rounded-2xl px-4 py-3 font-display text-sm font-semibold transition ${
            activeView === 'standings'
              ? 'bg-[var(--theme-plum)] text-[var(--theme-cream)]'
              : 'bg-[var(--theme-surface)] text-[var(--theme-text-soft)] hover:bg-[var(--theme-aqua-soft)] hover:text-[var(--theme-plum)]'
          }`}
        >
          {t.navigation.standings}
        </button>
      </div>
    </section>
  )
}
