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
    <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_18px_60px_rgba(2,6,23,0.3)] backdrop-blur-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-sans text-2xl font-bold text-white">
            Pairings and results
          </h2>
          <p className="mt-1 text-sm text-slate-300">
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
                  ? 'bg-emerald-400/15 text-emerald-200'
                  : 'bg-amber-300/15 text-amber-100'
                : 'bg-violet-400/15 text-violet-100'
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
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-400">
          Pairings will appear after the tournament starts.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-slate-950/35 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Board</th>
                <th className="px-4 py-3 font-semibold">White</th>
                <th className="px-4 py-3 font-semibold">Black</th>
                <th className="px-4 py-3 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08] bg-transparent">
              {matches.map((match) => (
                <tr key={match.id}>
                  <td className="px-4 py-3 font-medium text-white">{match.board}</td>
                  <td className="px-4 py-3 text-slate-100">
                    {getPlayerName(players, match.whitePlayerId)}
                  </td>
                  <td className="px-4 py-3 text-slate-100">
                    {match.isBye ? 'BYE' : getPlayerName(players, match.blackPlayerId)}
                  </td>
                  <td className="px-4 py-3">
                    {match.isBye ? (
                      <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-semibold text-amber-100">
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
                        className="w-full rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25 disabled:cursor-not-allowed disabled:bg-slate-900/35 disabled:text-slate-500"
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
