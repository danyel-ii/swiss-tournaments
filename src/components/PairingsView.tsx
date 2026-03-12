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
    <section className="rounded-[32px] border border-[#2f6f66]/18 bg-[linear-gradient(180deg,_#edf5e3_0%,_#d8e5ca_100%)] p-6 shadow-[inset_0_2px_0_rgba(255,255,255,0.78),0_18px_30px_rgba(63,96,75,0.12)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-[#27535d]">
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
          <p className="font-data mt-1 text-sm text-[#5f736c]">
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
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-amber-200 text-amber-900'
                : 'bg-sky-200 text-sky-900'
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
        <div className="font-data mt-6 rounded-2xl border border-dashed border-[#acb899] bg-[#fffaf0] px-4 py-8 text-center text-sm text-[#67756f]">
          Pairings will appear after the tournament starts.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#bfd0bb] bg-[#fff9ed]">
          <table className="min-w-full divide-y divide-[#d2dbc7] text-left text-sm">
            <thead className="bg-[#d9e7d0] text-[#506860]">
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
            <tbody className="divide-y divide-[#d2dbc7] bg-transparent">
              {matches.map((match) => (
                <tr key={match.id}>
                  <td className="font-display px-4 py-3 font-medium text-[#2b4e58]">{match.board}</td>
                  <td className="font-data px-4 py-3 text-[#34535a]">
                    {getPlayerName(players, match.whitePlayerId)}
                  </td>
                  <td className="font-data px-4 py-3 text-[#34535a]">
                    {match.isBye ? 'BYE' : getPlayerName(players, match.blackPlayerId)}
                  </td>
                  <td className="px-4 py-3">
                    {match.isBye ? (
                      <span className="font-display rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
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
                        className="font-data w-full rounded-xl border-2 border-[#d2b061] bg-[#fff7dc] px-3 py-2 text-[#244a54] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-[#ebe4cb] disabled:text-[#8d8b7f]"
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
