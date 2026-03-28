import { ActionBar } from './ActionBar'
import { PairingsView } from './PairingsView'
import { useI18n } from '../useI18n'
import type { ManualMatchResult, Match, Player, TournamentStatus } from '../types/tournament'

interface LiveViewProps {
  tournamentName: string
  currentRound: number
  totalRounds: number
  status: TournamentStatus
  matches: Match[]
  players: Player[]
  resultsEntered: number
  resultTarget: number
  roundComplete: boolean
  canGenerateNextRound: boolean
  completed: boolean
  onSetResult: (matchId: string, result: ManualMatchResult) => void
  onGenerateNextRound: () => void
}

export function LiveView({
  tournamentName,
  currentRound,
  totalRounds,
  status,
  matches,
  players,
  resultsEntered,
  resultTarget,
  roundComplete,
  canGenerateNextRound,
  completed,
  onSetResult,
  onGenerateNextRound,
}: LiveViewProps) {
  const { t } = useI18n()
  const hasStarted = status !== 'setup'

  return (
    <div className="space-y-6">
      <section className="theme-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-3 border-b border-[rgba(54,6,77,0.12)] pb-6">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--theme-text-soft)]">
            {t.navigation.live}
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="theme-heading font-display text-4xl font-bold tracking-[-0.04em] md:text-5xl">
                {t.live.title}
              </h2>
              <p className="theme-copy mt-2 font-data text-base">
                {t.live.subtitle}
              </p>
            </div>

            <div className="rounded-3xl bg-[var(--theme-plum)] px-5 py-4 text-[var(--theme-cream)]">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.28em] opacity-70">
                {t.live.currentRound(currentRound, totalRounds)}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">{tournamentName}</p>
              <p className="mt-1 font-data text-sm opacity-80">
                {hasStarted
                  ? t.live.resultsEntered(resultsEntered, resultTarget)
                  : t.actions.setupPrompt}
              </p>
            </div>
          </div>
        </div>
      </section>

      <PairingsView
        hasStarted={hasStarted}
        matches={matches}
        players={players}
        viewedRound={currentRound}
        isViewingCurrentRound
        resultsEntered={resultsEntered}
        resultTarget={resultTarget}
        isRoundComplete={roundComplete}
        onSetResult={onSetResult}
      />

      <ActionBar
        canGenerateNextRound={canGenerateNextRound}
        isCompleted={completed}
        currentRound={currentRound}
        totalRounds={totalRounds}
        onGenerateNextRound={onGenerateNextRound}
      />
    </div>
  )
}
