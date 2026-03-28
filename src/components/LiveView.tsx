import { ActionBar } from './ActionBar'
import { PairingsView } from './PairingsView'
import { useI18n } from '../useI18n'
import type { ManualMatchResult, Match, Player, TournamentStatus } from '../types/tournament'

interface LiveViewProps {
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
      <section className="theme-panel rounded-3xl px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
              {t.live.currentRound(currentRound, totalRounds)}
            </p>
            <p className="theme-copy mt-1 font-data text-sm">
              {hasStarted
                ? t.live.resultsEntered(resultsEntered, resultTarget)
                : t.actions.setupPrompt}
            </p>
          </div>
          <span className="rounded-full bg-[var(--theme-plum-soft)] px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-plum)]">
            {t.navigation.live}
          </span>
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
