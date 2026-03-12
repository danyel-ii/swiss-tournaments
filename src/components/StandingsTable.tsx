import { Fragment, useState } from 'react'
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
    return 'from-amber-300/55 via-yellow-200/25 to-transparent border-amber-300/40'
  }

  if (rank === 2) {
    return 'from-cyan-300/40 via-sky-200/15 to-transparent border-cyan-300/30'
  }

  return 'from-fuchsia-400/35 via-violet-300/15 to-transparent border-fuchsia-300/30'
}

export function StandingsTable({
  standings,
  players,
  matches,
}: StandingsTableProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)
  const podium = standings.slice(0, 3)

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_18px_60px_rgba(2,6,23,0.3)] backdrop-blur-xl">
      <div>
        <h2 className="font-sans text-2xl font-bold text-white">Standings</h2>
        <p className="mt-1 text-sm text-slate-300">
          Sorted by score, Buchholz, seed, and name.
        </p>
      </div>

      {podium.length > 0 ? (
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {podium.map((standing) => (
            <article
              key={standing.playerId}
              className={`relative overflow-hidden rounded-[24px] border bg-gradient-to-br ${getAccent(
                standing.rank,
              )} p-4`}
            >
              <div className="absolute -right-3 top-0 font-sans text-7xl font-black tracking-[-0.08em] text-white/10">
                {String(standing.rank).padStart(2, '0')}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-300">
                Rank {standing.rank}
              </p>
              <h3 className="mt-4 font-sans text-xl font-bold text-white">
                {standing.name}
              </h3>
              <div className="mt-4 flex items-end justify-between">
                <p className="font-sans text-4xl font-black tracking-[-0.05em] text-white">
                  {formatScore(standing.score)}
                </p>
                <div className="text-right text-sm text-slate-200">
                  <p>Buchholz {formatScore(standing.buchholz)}</p>
                  <p>Seed {standing.seed}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-slate-950/35 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Rank</th>
              <th className="px-4 py-3 font-semibold">Player</th>
              <th className="px-4 py-3 font-semibold">Seed</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Buchholz</th>
              <th className="px-4 py-3 font-semibold">Colors</th>
              <th className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.08] bg-transparent">
            {standings.map((standing) => {
              const isExpanded = expandedPlayerId === standing.playerId
              const history = getPlayerMatchHistory(standing.playerId, matches)

              return (
                <Fragment key={standing.playerId}>
                  <tr
                    className={standing.rank <= 3 ? 'bg-white/[0.03]' : undefined}
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {standing.rank}
                    </td>
                    <td className="px-4 py-3 text-slate-100">{standing.name}</td>
                    <td className="px-4 py-3 text-slate-300">{standing.seed}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {formatScore(standing.score)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatScore(standing.buchholz)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {standing.colorHistory.join('') || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPlayerId(isExpanded ? null : standing.playerId)
                        }
                        className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-cyan-300/45 hover:text-white"
                      >
                        {isExpanded ? 'Hide' : 'Open'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr key={`${standing.playerId}-details`} className="bg-slate-950/25">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid gap-3 lg:grid-cols-2">
                          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                              Summary
                            </p>
                            <div className="mt-3 grid gap-2 text-sm text-slate-200">
                              <p>Opponents faced: {standing.opponents.length}</p>
                              <p>Received bye: {standing.receivedBye ? 'Yes' : 'No'}</p>
                              <p>Color path: {standing.colorHistory.join(' ') || '-'}</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                              Opponent results
                            </p>
                            <div className="mt-3 space-y-2 text-sm">
                              {history.length === 0 ? (
                                <p className="text-slate-400">No completed rounds yet.</p>
                              ) : (
                                history.map((match) => {
                                  const opponentId =
                                    match.whitePlayerId === standing.playerId
                                      ? match.blackPlayerId
                                      : match.whitePlayerId

                                  return (
                                    <div
                                      key={match.id}
                                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/35 px-3 py-2"
                                    >
                                      <div>
                                        <p className="font-medium text-white">
                                          {match.isBye
                                            ? 'Bye'
                                            : getPlayerName(
                                                players,
                                                opponentId ?? '',
                                              )}
                                        </p>
                                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                          Round {match.round} · Board {match.board}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-cyan-200">
                                          {getPlayerResultText(
                                            standing.playerId,
                                            match,
                                          )}
                                        </p>
                                        <p className="text-xs text-slate-400">
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
