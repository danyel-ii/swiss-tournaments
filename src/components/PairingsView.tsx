import { HelpTooltip } from './HelpTooltip'
import type { ManualMatchResult, Match, Player } from '../types/tournament'
import { useI18n } from '../useI18n'

interface PairingsViewProps {
  hasStarted: boolean
  matches: Match[]
  players: Player[]
  viewedRound: number
  isViewingCurrentRound: boolean
  resultsEntered: number
  resultTarget: number
  isRoundComplete: boolean
  onSetResult: (matchId: string, result: ManualMatchResult) => void
}

const resultOptions: ManualMatchResult[] = ['1-0', '0-1', '0.5-0.5', '0-0']

function getPlayerName(players: Player[], playerId: string | null, fallback: string): string {
  if (!playerId) {
    return fallback
  }

  return players.find((player) => player.id === playerId)?.name ?? fallback
}

export function PairingsView({
  hasStarted,
  matches,
  players,
  viewedRound,
  isViewingCurrentRound,
  resultsEntered,
  resultTarget,
  isRoundComplete,
  onSetResult,
}: PairingsViewProps) {
  const { t } = useI18n()

  return (
    <section className="theme-panel min-w-0 rounded-3xl p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="theme-heading font-display text-2xl font-semibold">
              {t.pairings.title}
            </h2>
            <HelpTooltip
              label={t.pairings.workflowLabel}
              title={t.pairings.workflowTitle}
            >
              {t.pairings.workflowBody}
            </HelpTooltip>
          </div>
          <p className="theme-copy font-data mt-1 text-sm">
            {hasStarted
              ? isViewingCurrentRound
                ? isRoundComplete
                  ? t.pairings.roundComplete
                  : t.pairings.resultsEntered(resultsEntered, resultTarget)
                : t.pairings.archivedRound(viewedRound)
              : t.pairings.waiting}
          </p>
        </div>
        {hasStarted ? (
          <span
            className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
              isViewingCurrentRound
                ? isRoundComplete
                  ? 'bg-[var(--theme-aqua-soft)] text-[var(--theme-plum)]'
                  : 'bg-[var(--theme-red-soft)] text-[var(--theme-red)]'
                : 'bg-[var(--theme-plum-soft)] text-[var(--theme-plum)]'
            }`}
          >
            {isViewingCurrentRound
              ? isRoundComplete
                ? t.pairings.complete
                : t.pairings.incomplete
              : t.pairings.archive}
          </span>
        ) : null}
      </div>

      {!hasStarted ? (
        <div className="theme-muted-panel theme-copy font-data mt-6 rounded-3xl px-4 py-8 text-center text-sm">
          {t.pairings.waiting}
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3 md:hidden">
            {matches.map((match) => (
              <article key={match.id} className="theme-muted-panel rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-text-soft)]">
                      {t.pairings.board}
                    </p>
                    <p className="theme-heading mt-1 font-display text-xl font-semibold">
                      {match.board}
                    </p>
                  </div>
                  <span
                    className={`inline-flex self-start rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      match.isBye
                        ? 'bg-[var(--theme-plum-soft)] text-[var(--theme-plum)]'
                        : match.result
                          ? 'bg-[var(--theme-aqua-soft)] text-[var(--theme-plum)]'
                          : 'bg-[var(--theme-red-soft)] text-[var(--theme-red)]'
                    }`}
                  >
                    {match.isBye ? t.common.bye : match.result ?? t.common.pending}
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  <div>
                    <p className="font-data text-[10px] uppercase tracking-[0.16em] text-[var(--theme-text-soft)]">
                      {t.pairings.white}
                    </p>
                    <p className="theme-heading mt-1 font-display font-semibold">
                      {getPlayerName(players, match.whitePlayerId, t.common.unknown)}
                    </p>
                  </div>
                  <div>
                    <p className="font-data text-[10px] uppercase tracking-[0.16em] text-[var(--theme-text-soft)]">
                      {t.pairings.black}
                    </p>
                    <p className="theme-heading mt-1 font-display font-semibold">
                      {match.isBye ? t.common.bye : getPlayerName(players, match.blackPlayerId, t.common.unknown)}
                    </p>
                  </div>
                  <div>
                    <p className="font-data text-[10px] uppercase tracking-[0.16em] text-[var(--theme-text-soft)]">
                      {t.pairings.result}
                    </p>
                    {match.isBye ? (
                      <span className="font-display mt-2 inline-flex rounded-full bg-[var(--theme-plum-soft)] px-3 py-1 text-xs font-semibold text-[var(--theme-plum)]">
                        {t.common.bye}
                      </span>
                    ) : (
                      <select
                        aria-label={t.pairings.resultForBoard(match.board)}
                        value={match.result ?? ''}
                        disabled={!isViewingCurrentRound}
                        onChange={(event) =>
                          onSetResult(match.id, event.target.value as ManualMatchResult)
                        }
                        className="theme-input font-data mt-2 w-full rounded-2xl border px-3 py-2 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">{t.common.selectResult}</option>
                        {resultOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="theme-muted-panel mt-6 hidden overflow-x-auto rounded-3xl md:block">
            <table className="min-w-full text-left text-sm">
            <thead className="text-[var(--theme-text-soft)]">
              <tr>
                <th className="font-display px-4 py-3 font-semibold">{t.pairings.board}</th>
                <th className="font-display px-4 py-3 font-semibold">{t.pairings.white}</th>
                <th className="font-display px-4 py-3 font-semibold">{t.pairings.black}</th>
                <th className="font-display px-4 py-3 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    {t.pairings.result}
                    <HelpTooltip
                      label={t.pairings.allowedResultsLabel}
                      title={t.pairings.allowedResultsTitle}
                      align="right"
                    >
                      {t.pairings.allowedResultsBody}
                    </HelpTooltip>
                  </span>
                </th>
              </tr>
            </thead>
              <tbody className="divide-y divide-[rgba(54,6,77,0.12)] bg-transparent">
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td className="theme-heading font-display px-4 py-3 font-medium">{match.board}</td>
                    <td className="font-data px-4 py-3 text-[var(--theme-text-soft)]">
                      {getPlayerName(players, match.whitePlayerId, t.common.unknown)}
                    </td>
                    <td className="font-data px-4 py-3 text-[var(--theme-text-soft)]">
                      {match.isBye ? t.common.bye : getPlayerName(players, match.blackPlayerId, t.common.unknown)}
                    </td>
                    <td className="px-4 py-3">
                      {match.isBye ? (
                        <span className="font-display rounded-full bg-[var(--theme-plum-soft)] px-3 py-1 text-xs font-semibold text-[var(--theme-plum)]">
                          {t.common.bye}
                        </span>
                      ) : (
                        <select
                          aria-label={t.pairings.resultForBoard(match.board)}
                          value={match.result ?? ''}
                          disabled={!isViewingCurrentRound}
                          onChange={(event) =>
                            onSetResult(match.id, event.target.value as ManualMatchResult)
                          }
                          className="theme-input font-data w-full rounded-2xl border px-3 py-2 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">{t.common.selectResult}</option>
                          {resultOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
