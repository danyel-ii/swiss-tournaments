import { Fragment, useState } from 'react'
import { AvatarBadge, PawnIcon } from './GamePieces'
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

export function StandingsTable({
  standings,
  players,
  matches,
}: StandingsTableProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)
  const podium = standings.slice(0, 3)

  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl font-semibold text-slate-900">Standings</h2>
          <HelpTooltip
            label="How standings are sorted"
            title="Standings Rules"
          >
            Players are sorted by total score first, then by Buchholz, then by
            registration seed. Buchholz is the sum of the current scores of all
            completed opponents. Byes do not add Buchholz.
          </HelpTooltip>
        </div>
        <p className="font-data mt-1 text-sm text-slate-500">
          Sorted by score, Buchholz, and seed.
        </p>
      </div>

      {podium.length > 0 ? (
        <div className="mt-6 space-y-3">
          {podium.map((standing) => (
            <article
              key={standing.playerId}
              className={`relative rounded-3xl bg-slate-50 p-4 ${
                standing.rank === 1 ? 'border-2 border-amber-300' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AvatarBadge seed={standing.seed} />
                  <div>
                    <p className="font-data text-sm text-slate-500">
                      Rank {standing.rank}
                    </p>
                    <h3 className="font-display mt-1 text-xl font-semibold text-slate-900">
                      {standing.name}
                    </h3>
                  </div>
                </div>
                {standing.rank === 1 ? <span className="text-lg">★</span> : null}
              </div>
              <div className="mt-5 flex items-end justify-between">
                <p className="font-display text-4xl font-bold tracking-[-0.05em] text-slate-900">
                  {formatScore(standing.score)}
                </p>
                <div className="font-data text-right text-sm text-slate-500">
                  <p>Buchholz {formatScore(standing.buchholz)}</p>
                  <p>Seed {standing.seed}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-[0.8fr_2.2fr_1fr_1fr_1.1fr_1fr_auto] gap-3 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          <div>Rank</div>
          <div>Player</div>
          <div>Seed</div>
          <div>
            <span className="inline-flex items-center gap-2">
              Score
              <HelpTooltip label="How score works" title="Score">
                Wins are worth 1 point, draws 0.5, losses 0, double forfeits
                0, and a bye counts as 1 point.
              </HelpTooltip>
            </span>
          </div>
          <div>
            <span className="inline-flex items-center gap-2">
              Buchholz
              <HelpTooltip label="How Buchholz is computed" title="Buchholz">
                Add together the current scores of the player&apos;s completed
                opponents. A bye is not an opponent, so it contributes 0.
              </HelpTooltip>
            </span>
          </div>
          <div>
            <span className="inline-flex items-center gap-2">
              Colors
              <HelpTooltip label="How color history works" title="Color History">
                This shows prior color assignments across non-bye rounds. `W`
                means the player had White; `B` means they had Black.
              </HelpTooltip>
            </span>
          </div>
          <div>Details</div>
        </div>
          <div className="space-y-3">
          {standings.map((standing) => {
            const isExpanded = expandedPlayerId === standing.playerId
            const history = getPlayerMatchHistory(standing.playerId, matches)

            return (
              <Fragment key={standing.playerId}>
                <div
                  className={`grid grid-cols-[0.8fr_2.2fr_1fr_1fr_1.1fr_1fr_auto] items-center gap-3 rounded-3xl px-4 py-4 ${
                    standing.rank === 1 ? 'bg-amber-50' : 'bg-slate-50'
                  }`}
                >
                  <div className="font-display font-semibold text-slate-900">
                    {standing.rank}
                  </div>
                  <div className="flex items-center gap-3">
                    <AvatarBadge seed={standing.seed} size="sm" />
                    <span className="font-display font-semibold text-slate-900">
                      {standing.name}
                    </span>
                  </div>
                  <div className="font-data text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <PawnIcon className="h-4 w-4" />
                      {standing.seed}
                    </span>
                  </div>
                  <div className="font-display font-semibold text-slate-900">
                    {formatScore(standing.score)}
                  </div>
                  <div className="font-data text-slate-500">
                    {formatScore(standing.buchholz)}
                  </div>
                  <div className="font-data text-slate-500">
                    {standing.colorHistory.join('') || '-'}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPlayerId(isExpanded ? null : standing.playerId)
                      }
                      className="font-display rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 transition hover:bg-slate-100"
                    >
                      {isExpanded ? 'Hide' : 'Open'}
                    </button>
                  </div>
                </div>
                {isExpanded ? (
                  <div className="rounded-3xl bg-slate-50 px-4 py-4">
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="rounded-3xl bg-white p-4">
                        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                          Summary
                        </p>
                        <div className="font-data mt-3 grid gap-2 text-sm text-slate-600">
                          <p>Opponents faced: {standing.opponents.length}</p>
                          <p>Received bye: {standing.receivedBye ? 'Yes' : 'No'}</p>
                          <p>Color path: {standing.colorHistory.join(' ') || '-'}</p>
                        </div>
                      </div>
                      <div className="rounded-3xl bg-white p-4">
                        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                          Opponent results
                        </p>
                        <div className="mt-3 space-y-2 text-sm">
                          {history.length === 0 ? (
                            <p className="font-data text-slate-500">No completed rounds yet.</p>
                          ) : (
                            history.map((match) => {
                              const opponentId =
                                match.whitePlayerId === standing.playerId
                                  ? match.blackPlayerId
                                  : match.whitePlayerId

                              return (
                                <div
                                  key={match.id}
                                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"
                                >
                                  <div>
                                    <p className="font-display font-medium text-slate-900">
                                      {match.isBye
                                        ? 'Bye'
                                        : getPlayerName(
                                            players,
                                            opponentId ?? '',
                                          )}
                                    </p>
                                    <p className="font-data text-xs uppercase tracking-[0.18em] text-slate-400">
                                      Round {match.round} · Board {match.board}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-display font-semibold text-sky-600">
                                      {getPlayerResultText(
                                        standing.playerId,
                                        match,
                                      )}
                                    </p>
                                    <p className="font-data text-xs text-slate-400">
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
                  </div>
                ) : null}
              </Fragment>
            )
          })}
          </div>
      </div>
    </section>
  )
}
