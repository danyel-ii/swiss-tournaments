import type { ManualMatchResult, Match, Player } from '../types/tournament'

interface PairingsViewProps {
  hasStarted: boolean
  matches: Match[]
  players: Player[]
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
  resultsEntered,
  resultTarget,
  isRoundComplete,
  onSetResult,
}: PairingsViewProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-slate-900">Pairings and results</h2>
          <p className="mt-1 text-sm text-slate-600">
            {hasStarted
              ? isRoundComplete
                ? 'Round complete'
                : `${resultsEntered} of ${resultTarget} results entered`
              : 'Pairings will appear after the tournament starts.'}
          </p>
        </div>
        {hasStarted ? (
          <span
            className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
              isRoundComplete
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isRoundComplete ? 'Complete' : 'Incomplete'}
          </span>
        ) : null}
      </div>

      {!hasStarted ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          Pairings will appear after the tournament starts.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Board</th>
                <th className="px-4 py-3 font-semibold">White</th>
                <th className="px-4 py-3 font-semibold">Black</th>
                <th className="px-4 py-3 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {matches.map((match) => (
                <tr key={match.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{match.board}</td>
                  <td className="px-4 py-3 text-slate-800">
                    {getPlayerName(players, match.whitePlayerId)}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    {match.isBye ? 'BYE' : getPlayerName(players, match.blackPlayerId)}
                  </td>
                  <td className="px-4 py-3">
                    {match.isBye ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        BYE
                      </span>
                    ) : (
                      <select
                        aria-label={`Result for board ${match.board}`}
                        value={match.result ?? ''}
                        onChange={(event) =>
                          onSetResult(match.id, event.target.value as ManualMatchResult)
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
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
