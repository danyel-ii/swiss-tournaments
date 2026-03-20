import { useI18n } from '../i18n'

interface RoundNavigatorProps {
  rounds: number[]
  selectedRound: number
  currentRound: number
  onSelectRound: (round: number) => void
}

export function RoundNavigator({
  rounds,
  selectedRound,
  currentRound,
  onSelectRound,
}: RoundNavigatorProps) {
  const { t } = useI18n()

  if (rounds.length === 0) {
    return null
  }

  return (
    <section className="theme-panel rounded-3xl p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="theme-heading font-display text-lg font-semibold">{t.rounds.archiveTitle}</h2>
          <p className="theme-copy font-data text-sm">
            {t.rounds.archiveSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {rounds.map((round) => {
            const isSelected = round === selectedRound
            const isCurrent = round === currentRound

            return (
              <button
                key={round}
                type="button"
                onClick={() => onSelectRound(round)}
                className={`font-display rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  isSelected
                    ? 'border-[var(--theme-aqua)] bg-[var(--theme-aqua-soft)] text-[var(--theme-plum)]'
                    : isCurrent
                      ? 'border-[var(--theme-plum)] bg-[var(--theme-plum-soft)] text-[var(--theme-plum)]'
                      : 'border-[var(--theme-border)] bg-[var(--theme-cream)] text-[var(--theme-text-soft)] hover:border-[var(--theme-aqua)] hover:text-[var(--theme-plum)]'
                }`}
              >
                {t.rounds.round(round)}
                {isCurrent ? ` ${t.common.live}` : ''}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
