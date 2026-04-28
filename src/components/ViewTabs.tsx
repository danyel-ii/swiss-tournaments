import { useI18n } from '../useI18n'
import type { AppView } from '../types/views'

interface ViewTabsProps {
  activeView: AppView
  onSelectView: (view: AppView) => void
}

export function ViewTabs({ activeView, onSelectView }: ViewTabsProps) {
  const { t } = useI18n()
  const tabs: Array<{ view: AppView; label: string }> = [
    { view: 'dashboard', label: t.navigation.dashboard },
    { view: 'tournaments', label: t.navigation.tournaments },
    { view: 'live', label: t.navigation.live },
    { view: 'standings', label: t.navigation.standings },
    { view: 'ongoingTables', label: t.navigation.tables },
    { view: 'statistics', label: t.navigation.statistics },
    { view: 'headToHead', label: t.navigation.headToHead },
  ]

  return (
    <section className="theme-panel rounded-3xl p-2">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.view}
            type="button"
            onClick={() => onSelectView(tab.view)}
            className={`w-full max-w-full rounded-2xl px-4 py-3 text-center font-display text-sm font-semibold transition sm:w-auto ${
              activeView === tab.view
                ? 'bg-[var(--theme-plum)] text-[var(--theme-cream)]'
                : 'bg-[var(--theme-surface)] text-[var(--theme-text-soft)] hover:bg-[var(--theme-aqua-soft)] hover:text-[var(--theme-plum)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </section>
  )
}
