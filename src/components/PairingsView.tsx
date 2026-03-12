import { HelpTooltip } from './HelpTooltip'
import type { ManualMatchResult, Match, Player } from '../types/tournament'

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

function getPlayerName(players: Player[], playerId: string | null): string {
  if (!playerId) {
    return 'Bye'
  }

  return players.find((player) => player.id === playerId)?.name ?? 'Unknown'
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
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              Pairings and results
            </h2>
            <HelpTooltip
              label="How pairings and result entry work"
              title="Round Workflow"
            >
              Enter one result for every non-bye board in the current round. The
              next round stays locked until all live boards have a completed
              result. `0-0` is a real completed result, not a placeholder.
            </HelpTooltip>
          </div>
          <p className="font-data mt-1 text-sm text-slate-500">
            {hasStarted
              ? isViewingCurrentRound
                ? isRoundComplete
                  ? 'Round complete'
                  : `${resultsEntered} of ${resultTarget} results entered`
                : `Reviewing archived pairings for round ${viewedRound}`
              : 'Pairings will appear after the tournament starts.'}
          </p>
        </div>
        {hasStarted ? (
          <span
            className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
              isViewingCurrentRound
                ? isRoundComplete
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
                : 'bg-violet-100 text-violet-700'
            }`}
          >
            {isViewingCurrentRound
              ? isRoundComplete
                ? 'Complete'
                : 'Incomplete'
              : 'Archive'}
          </span>
        ) : null}
      </div>

      {!hasStarted ? (
        <div className="font-data mt-6 rounded-3xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Pairings will appear after the tournament starts.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl bg-slate-50">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="font-display px-4 py-3 font-semibold">Board</th>
                <th className="font-display px-4 py-3 font-semibold">White</th>
                <th className="font-display px-4 py-3 font-semibold">Black</th>
                <th className="font-display px-4 py-3 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    Result
                    <HelpTooltip
                      label="Allowed result values"
                      title="Allowed Results"
                      align="right"
                    >
                      Manual entries are `1-0`, `0-1`, `0.5-0.5`, and `0-0`. A
                      bye is stored automatically as `BYE` and cannot be edited.
                    </HelpTooltip>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 bg-transparent">
              {matches.map((match) => (
                <tr key={match.id}>
                  <td className="font-display px-4 py-3 font-medium text-slate-900">{match.board}</td>
                  <td className="font-data px-4 py-3 text-slate-700">
                    {getPlayerName(players, match.whitePlayerId)}
                  </td>
                  <td className="font-data px-4 py-3 text-slate-700">
                    {match.isBye ? 'BYE' : getPlayerName(players, match.blackPlayerId)}
                  </td>
                  <td className="px-4 py-3">
                    {match.isBye ? (
                      <span className="font-display rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        BYE
                      </span>
                    ) : (
                      <select
                        aria-label={`Result for board ${match.board}`}
                        value={match.result ?? ''}
                        disabled={!isViewingCurrentRound}
                        onChange={(event) =>
                          onSetResult(match.id, event.target.value as ManualMatchResult)
                        }
                        className="font-data w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">Select result</option>
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
      )}
    </section>
  )
}
