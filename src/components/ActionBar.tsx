import { useI18n } from '../useI18n'

interface ActionBarProps {
  canGenerateNextRound: boolean
  isCompleted: boolean
  currentRound: number
  totalRounds: number
  onGenerateNextRound: () => void
}

export function ActionBar({
  canGenerateNextRound,
  isCompleted,
  currentRound,
  totalRounds,
  onGenerateNextRound,
}: ActionBarProps) {
  const { t } = useI18n()

  return (
    <section className="theme-panel min-w-0 rounded-3xl p-6">
      {isCompleted ? (
        <div className="font-display rounded-3xl bg-[var(--theme-aqua-soft)] px-4 py-4 text-sm font-medium text-[var(--theme-plum)]">
          {t.actions.completedMessage(totalRounds)}
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="theme-heading font-display text-2xl font-semibold">{t.actions.title}</h2>
            <p className="theme-copy font-data mt-1 text-sm">
              {currentRound === 0
                ? t.actions.setupPrompt
                : t.actions.generatePrompt}
            </p>
          </div>

          <button
            type="button"
            disabled={!canGenerateNextRound}
            onClick={onGenerateNextRound}
            className="theme-button-plum font-display w-full rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none disabled:cursor-not-allowed sm:w-auto"
          >
            {currentRound >= totalRounds ? t.actions.finalRoundComplete : t.actions.generateNextRound}
          </button>
        </div>
      )}
    </section>
  )
}
