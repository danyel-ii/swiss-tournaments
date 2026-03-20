import { Fragment, useState } from 'react'
import { AvatarBadge, PawnIcon } from './GamePieces'
import { HelpTooltip } from './HelpTooltip'
import { formatScore } from '../utils/format'
import type { Match, Player, PlayerStanding } from '../types/tournament'
import { useI18n } from '../useI18n'

interface StandingsTableProps {
  standings: PlayerStanding[]
  players: Player[]
  matches: Match[]
}

function getPlayerName(players: Player[], playerId: string, fallback: string): string {
  return players.find((player) => player.id === playerId)?.name ?? fallback
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

function getPlayerResultText(playerId: string, match: Match, byeLabel: string, pendingLabel: string): string {
  if (match.isBye) {
    return byeLabel
  }

  if (match.result === null) {
    return pendingLabel
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
  const { t } = useI18n()
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)
  const podium = standings.slice(0, 3)

  return (
    <section className="theme-panel rounded-3xl p-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="theme-heading font-display text-2xl font-semibold">{t.standings.title}</h2>
          <HelpTooltip
            label={t.standings.tooltipLabel}
            title={t.standings.tooltipTitle}
          >
            {t.standings.tooltipBody}
          </HelpTooltip>
        </div>
        <p className="theme-copy font-data mt-1 text-sm">
          {t.standings.subtitle}
        </p>
      </div>

      {podium.length > 0 ? (
        <div className="mt-6 space-y-3">
          {podium.map((standing) => (
            <article
              key={standing.playerId}
              className={`theme-muted-panel relative rounded-3xl p-4 ${
                standing.rank === 1 ? 'border-2 border-[var(--theme-red)]' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AvatarBadge seed={standing.seed} />
                  <div>
                    <p className="theme-copy font-data text-sm">
                      {t.standings.rank} {standing.rank}
                    </p>
                    <h3 className="theme-heading font-display mt-1 text-xl font-semibold">
                      {standing.name}
                    </h3>
                  </div>
                </div>
                {standing.rank === 1 ? <span className="text-lg">★</span> : null}
              </div>
              <div className="mt-5 flex items-end justify-between">
                <p className="theme-heading font-display text-4xl font-bold tracking-[-0.05em]">
                  {formatScore(standing.score)}
                </p>
                <div className="theme-copy font-data text-right text-sm">
                  <p>Buchholz {formatScore(standing.buchholz)}</p>
                  <p>{t.standings.seed} {standing.seed}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <div className="hidden grid-cols-[0.8fr_2.2fr_1fr_1fr_1.1fr_1fr_auto] gap-3 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--theme-text-soft)] md:grid">
          <div>{t.standings.rank}</div>
          <div>{t.standings.player}</div>
          <div>{t.standings.seed}</div>
          <div>
            <span className="inline-flex items-center gap-2">
              {t.standings.score}
              <HelpTooltip label={t.standings.scoreHelpLabel} title={t.standings.scoreHelpTitle}>
                {t.standings.scoreHelpBody}
              </HelpTooltip>
            </span>
          </div>
          <div>
            <span className="inline-flex items-center gap-2">
              {t.standings.buchholz}
              <HelpTooltip
                label={t.standings.buchholzHelpLabel}
                title={t.standings.buchholzHelpTitle}
              >
                {t.standings.buchholzHelpBody}
              </HelpTooltip>
            </span>
          </div>
          <div>
            <span className="inline-flex items-center gap-2">
              {t.standings.colors}
              <HelpTooltip label={t.standings.colorsHelpLabel} title={t.standings.colorsHelpTitle}>
                {t.standings.colorsHelpBody}
              </HelpTooltip>
            </span>
          </div>
          <div>{t.standings.details}</div>
        </div>
        <div className="space-y-3">
          {standings.map((standing) => {
            const isExpanded = expandedPlayerId === standing.playerId
            const history = getPlayerMatchHistory(standing.playerId, matches)

            return (
              <Fragment key={standing.playerId}>
                <div
                  className={`rounded-3xl px-4 py-4 ${
                    standing.rank === 1 ? 'bg-[var(--theme-red-soft)]' : 'theme-muted-panel'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 md:hidden">
                    <div className="min-w-0 flex items-center gap-3">
                      <AvatarBadge seed={standing.seed} size="sm" />
                      <div className="min-w-0">
                        <p className="theme-copy font-data text-xs uppercase tracking-[0.16em]">
                          {t.standings.rank} {standing.rank}
                        </p>
                        <span className="theme-heading block truncate font-display font-semibold">
                          {standing.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="theme-heading font-display text-2xl font-semibold">
                        {formatScore(standing.score)}
                      </div>
                      <div className="font-data text-xs text-[var(--theme-text-soft)]">
                        {t.standings.score}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm md:hidden">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="font-data text-[10px] uppercase tracking-[0.16em] text-[var(--theme-text-soft)]">
                          {t.standings.seed}
                        </p>
                        <p className="theme-heading font-display font-semibold">{standing.seed}</p>
                      </div>
                      <div>
                        <p className="font-data text-[10px] uppercase tracking-[0.16em] text-[var(--theme-text-soft)]">
                          {t.standings.buchholz}
                        </p>
                        <p className="theme-heading font-display font-semibold">
                          {formatScore(standing.buchholz)}
                        </p>
                      </div>
                      <div>
                        <p className="font-data text-[10px] uppercase tracking-[0.16em] text-[var(--theme-text-soft)]">
                          {t.standings.colors}
                        </p>
                        <p className="theme-heading font-display font-semibold">
                          {standing.colorHistory.join('') || '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPlayerId(isExpanded ? null : standing.playerId)
                        }
                        className="font-display rounded-full bg-[var(--theme-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--theme-plum)] transition hover:bg-[var(--theme-aqua-soft)]"
                      >
                        {isExpanded ? t.common.hide : t.common.open}
                      </button>
                    </div>
                  </div>

                  <div className="hidden items-center gap-3 md:grid md:grid-cols-[0.8fr_2.2fr_1fr_1fr_1.1fr_1fr_auto]">
                    <div className="theme-heading font-display font-semibold">
                      {standing.rank}
                    </div>
                    <div className="min-w-0 flex items-center gap-3">
                      <AvatarBadge seed={standing.seed} size="sm" />
                      <span className="theme-heading truncate font-display font-semibold">
                        {standing.name}
                      </span>
                    </div>
                    <div className="theme-copy font-data">
                      <span className="inline-flex items-center gap-2">
                        <PawnIcon className="h-4 w-4" />
                        {standing.seed}
                      </span>
                    </div>
                    <div className="theme-heading font-display font-semibold">
                      {formatScore(standing.score)}
                    </div>
                    <div className="theme-copy font-data">
                      {formatScore(standing.buchholz)}
                    </div>
                    <div className="theme-copy font-data">
                      {standing.colorHistory.join('') || '-'}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPlayerId(isExpanded ? null : standing.playerId)
                        }
                        className="font-display rounded-full bg-[var(--theme-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--theme-plum)] transition hover:bg-[var(--theme-aqua-soft)]"
                      >
                        {isExpanded ? t.common.hide : t.common.open}
                      </button>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <div className="theme-muted-panel rounded-3xl px-4 py-4">
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="theme-panel rounded-3xl p-4">
                        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--theme-text-soft)]">
                          {t.standings.summary}
                        </p>
                        <div className="font-data mt-3 grid gap-2 text-sm text-[var(--theme-text-soft)]">
                          <p>{t.standings.opponentsFaced(standing.opponents.length)}</p>
                          <p>{t.standings.receivedBye(standing.receivedBye)}</p>
                          <p>{t.standings.colorPath(standing.colorHistory.join(' ') || '-')}</p>
                        </div>
                      </div>
                      <div className="theme-panel rounded-3xl p-4">
                        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--theme-text-soft)]">
                          {t.standings.opponentResults}
                        </p>
                        <div className="mt-3 space-y-2 text-sm">
                          {history.length === 0 ? (
                            <p className="theme-copy font-data">{t.standings.noCompletedRounds}</p>
                          ) : (
                            history.map((match) => {
                              const opponentId =
                                match.whitePlayerId === standing.playerId
                                  ? match.blackPlayerId
                                  : match.whitePlayerId

                              return (
                                <div
                                  key={match.id}
                                  className="theme-muted-panel flex items-center justify-between rounded-2xl px-3 py-2"
                                >
                                  <div>
                                    <p className="theme-heading font-display font-medium">
                                      {match.isBye
                                        ? t.common.bye
                                        : getPlayerName(
                                            players,
                                            opponentId ?? '',
                                            t.common.unknown,
                                          )}
                                    </p>
                                    <p className="font-data text-xs uppercase tracking-[0.18em] text-[var(--theme-text-soft)]">
                                      {t.standings.roundBoard(match.round, match.board)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-display font-semibold text-[var(--theme-red)]">
                                      {getPlayerResultText(
                                        standing.playerId,
                                        match,
                                        t.common.bye,
                                        t.common.pending,
                                      )}
                                    </p>
                                    <p className="font-data text-xs text-[var(--theme-text-soft)]">
                                      {match.isBye
                                        ? t.common.autoPoint
                                        : match.whitePlayerId === standing.playerId
                                          ? t.common.playedWhite
                                          : t.common.playedBlack}
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
