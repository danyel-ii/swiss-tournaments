import { Fragment, useState } from 'react'
import { AvatarBadge, CrownIcon, FlagIcon, PawnIcon } from './GamePieces'
import { HelpTooltip } from './HelpTooltip'
import { formatScore } from '../utils/format'
import type { Match, Player, PlayerStanding } from '../types/tournament'

interface StandingsTableProps {
  standings: PlayerStanding[]
  players: Player[]
  matches: Match[]
}

function getPlayerName(players: Player[], playerId: string): string {
  return players.find((player) => player.id === playerId)?.name ?? 'Unknown'
}

function getPlayerMatchHistory(playerId: string, matches: Match[]) {
  return matches
    .filter(
      (match) =>
        match.result !== null &&
        (match.whitePlayerId === playerId || match.blackPlayerId === playerId),
    )
    .sort((left, right) => {
      if (left.round !== right.round) {
        return left.round - right.round
      }

      return left.board - right.board
    })
}

function getPlayerResultText(playerId: string, match: Match): string {
  if (match.isBye) {
    return 'BYE'
  }

  if (match.result === null) {
    return 'Pending'
  }

  if (match.whitePlayerId === playerId) {
    return match.result
  }

  if (match.result === '1-0') {
    return '0-1'
  }

  if (match.result === '0-1') {
    return '1-0'
  }

  return match.result
}

function getAccent(rank: number): string {
  if (rank === 1) {
    return 'bg-[linear-gradient(180deg,_#ffe08c_0%,_#d4a232_100%)] border-[#c79524]'
  }

  if (rank === 2) {
    return 'bg-[linear-gradient(180deg,_#e3edf1_0%,_#aac0cd_100%)] border-[#8aa4b3]'
  }

  return 'bg-[linear-gradient(180deg,_#efca9d_0%,_#bb8655_100%)] border-[#a96f45]'
}

export function StandingsTable({
  standings,
  players,
  matches,
}: StandingsTableProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)
  const podium = standings.slice(0, 3)

  return (
    <section className="rounded-[32px] border border-[#2f6f66]/18 bg-[linear-gradient(180deg,_#2e6f8c_0%,_#295f75_100%)] p-6 shadow-[inset_0_2px_0_rgba(255,255,255,0.18),0_18px_36px_rgba(34,73,89,0.2)]">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl font-bold text-white">Royal Standings</h2>
          <HelpTooltip
            label="How standings are sorted"
            title="Standings Rules"
          >
            Players are sorted by total score first, then by Buchholz, then by
            registration seed. Buchholz is the sum of the current scores of all
            completed opponents. Byes do not add Buchholz.
          </HelpTooltip>
        </div>
        <p className="font-data mt-1 text-sm text-sky-100/85">
          Sorted by score, Buchholz, and seed.
        </p>
      </div>

      {podium.length > 0 ? (
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {podium.map((standing) => (
            <article
              key={standing.playerId}
              className={`relative overflow-hidden rounded-[26px] border p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.42),0_14px_22px_rgba(15,23,42,0.18)] ${getAccent(
                standing.rank,
              )}`}
            >
              <div className="absolute right-3 top-3 rounded-full bg-white/35 px-3 py-1 shadow-[inset_0_2px_0_rgba(255,255,255,0.65)]">
                <span className="font-display text-xs font-bold uppercase tracking-[0.22em] text-slate-900">
                  {String(standing.rank).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AvatarBadge seed={standing.seed} />
                  <div>
                    <p className="font-display text-[10px] font-bold uppercase tracking-[0.34em] text-slate-900/65">
                      Rank {standing.rank}
                    </p>
                    <h3 className="font-display mt-1 text-xl font-bold text-slate-950">
                      {standing.name}
                    </h3>
                  </div>
                </div>
                {standing.rank === 1 ? <CrownIcon className="h-6 w-6" /> : null}
              </div>
              <div className="mt-5 flex items-end justify-between">
                <p className="font-display text-4xl font-extrabold tracking-[-0.05em] text-slate-950">
                  {formatScore(standing.score)}
                </p>
                <div className="font-data text-right text-sm text-slate-900/72">
                  <p>Buchholz {formatScore(standing.buchholz)}</p>
                  <p>Seed {standing.seed}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-sky-900/12 bg-[#f4efe0]">
        <table className="min-w-full divide-y divide-[#cbd4bf] text-left text-sm">
          <thead className="bg-[#dce7dc] text-[#42615e]">
            <tr>
              <th className="font-display px-4 py-3 font-semibold">Rank</th>
              <th className="font-display px-4 py-3 font-semibold">Player</th>
              <th className="font-display px-4 py-3 font-semibold">Seed</th>
              <th className="font-display px-4 py-3 font-semibold">
                <span className="inline-flex items-center gap-2">
                  Score
                  <HelpTooltip label="How score works" title="Score">
                    Wins are worth 1 point, draws 0.5, losses 0, double forfeits
                    0, and a bye counts as 1 point.
                  </HelpTooltip>
                </span>
              </th>
              <th className="font-display px-4 py-3 font-semibold">
                <span className="inline-flex items-center gap-2">
                  Buchholz
                  <HelpTooltip label="How Buchholz is computed" title="Buchholz">
                    Add together the current scores of the player&apos;s completed
                    opponents. A bye is not an opponent, so it contributes 0.
                  </HelpTooltip>
                </span>
              </th>
              <th className="font-display px-4 py-3 font-semibold">
                <span className="inline-flex items-center gap-2">
                  Colors
                  <HelpTooltip label="How color history works" title="Color History">
                    This shows prior color assignments across non-bye rounds. `W`
                    means the player had White; `B` means they had Black.
                  </HelpTooltip>
                </span>
              </th>
              <th className="font-display px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d3dac8] bg-transparent">
            {standings.map((standing) => {
              const isExpanded = expandedPlayerId === standing.playerId
              const history = getPlayerMatchHistory(standing.playerId, matches)

              return (
                <Fragment key={standing.playerId}>
                  <tr
                    className={standing.rank <= 3 ? 'bg-[#eef3dd]' : 'bg-[#fbf8ee]'}
                  >
                    <td className="font-display px-4 py-3 font-medium text-[#234651]">
                      <span className="inline-flex items-center gap-2">
                        <FlagIcon className="h-4 w-4" />
                        {standing.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#234651]">
                      <span className="flex items-center gap-3">
                        <AvatarBadge seed={standing.seed} size="sm" />
                        <span className="font-display text-base font-bold">
                          {standing.name}
                        </span>
                      </span>
                    </td>
                    <td className="font-data px-4 py-3 text-[#5e6f69]">
                      <span className="inline-flex items-center gap-2">
                        <PawnIcon className="h-4 w-4" />
                        {standing.seed}
                      </span>
                    </td>
                    <td className="font-display px-4 py-3 font-semibold text-[#1e4451]">
                      {formatScore(standing.score)}
                    </td>
                    <td className="font-data px-4 py-3 text-[#5e6f69]">
                      {formatScore(standing.buchholz)}
                    </td>
                    <td className="font-data px-4 py-3 text-[#5e6f69]">
                      {standing.colorHistory.join('') || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPlayerId(isExpanded ? null : standing.playerId)
                        }
                        className="font-display rounded-full border border-[#aeb6a0] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#35545c] transition hover:border-[#69858c] hover:text-[#173944]"
                      >
                        {isExpanded ? 'Hide' : 'Open'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr key={`${standing.playerId}-details`} className="bg-[#edf3e3]">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid gap-3 lg:grid-cols-2">
                          <div className="rounded-2xl border border-[#c2ccb7] bg-[#fffaf0] p-4">
                            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-[#638179]">
                              Summary
                            </p>
                            <div className="font-data mt-3 grid gap-2 text-sm text-[#4e625f]">
                              <p>Opponents faced: {standing.opponents.length}</p>
                              <p>Received bye: {standing.receivedBye ? 'Yes' : 'No'}</p>
                              <p>Color path: {standing.colorHistory.join(' ') || '-'}</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-[#c2ccb7] bg-[#fffaf0] p-4">
                            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-[#638179]">
                              Opponent results
                            </p>
                            <div className="mt-3 space-y-2 text-sm">
                              {history.length === 0 ? (
                                <p className="font-data text-[#6b7b73]">No completed rounds yet.</p>
                              ) : (
                                history.map((match) => {
                                  const opponentId =
                                    match.whitePlayerId === standing.playerId
                                      ? match.blackPlayerId
                                      : match.whitePlayerId

                                  return (
                                    <div
                                      key={match.id}
                                      className="flex items-center justify-between rounded-xl border border-[#d1d8c7] bg-[#f8f2e6] px-3 py-2"
                                    >
                                      <div>
                                        <p className="font-display font-medium text-[#284a54]">
                                          {match.isBye
                                            ? 'Bye'
                                            : getPlayerName(
                                                players,
                                                opponentId ?? '',
                                              )}
                                        </p>
                                        <p className="font-data text-xs uppercase tracking-[0.22em] text-[#7b897f]">
                                          Round {match.round} · Board {match.board}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-display font-semibold text-[#275d69]">
                                          {getPlayerResultText(
                                            standing.playerId,
                                            match,
                                          )}
                                        </p>
                                        <p className="font-data text-xs text-[#7b897f]">
                                          {match.isBye
                                            ? 'Auto point'
                                            : match.whitePlayerId === standing.playerId
                                              ? 'Played White'
                                              : 'Played Black'}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
