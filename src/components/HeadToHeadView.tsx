import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../useI18n'
import { formatDateTime, formatScore } from '../utils/format'
import type { HeadToHeadDetail, PlayerStatsSummary } from '../types/library'

interface HeadToHeadViewProps {
  players: PlayerStatsSummary[]
  detail: HeadToHeadDetail | null
  loading: boolean
  error: string | null
  onChangePlayers: (leftPlayerId: string | null, rightPlayerId: string | null) => void
}

export function HeadToHeadView({
  players,
  detail,
  loading,
  error,
  onChangePlayers,
}: HeadToHeadViewProps) {
  const { t } = useI18n()
  const [leftPlayerId, setLeftPlayerId] = useState<string | null>(players[0]?.playerId ?? null)
  const [rightPlayerId, setRightPlayerId] = useState<string | null>(players[1]?.playerId ?? null)

  const selectablePlayers = useMemo(
    () => players.map((player) => ({ id: player.playerId, name: player.name })),
    [players],
  )
  const effectiveLeftPlayerId = leftPlayerId ?? players[0]?.playerId ?? null
  const effectiveRightPlayerId =
    rightPlayerId ?? players.find((player) => player.playerId !== effectiveLeftPlayerId)?.playerId ?? null

  useEffect(() => {
    onChangePlayers(effectiveLeftPlayerId, effectiveRightPlayerId)
  }, [effectiveLeftPlayerId, effectiveRightPlayerId, onChangePlayers])

  const handleLeftChange = (value: string) => {
    const nextValue = value || null
    setLeftPlayerId(nextValue)
    onChangePlayers(nextValue, rightPlayerId)
  }

  const handleRightChange = (value: string) => {
    const nextValue = value || null
    setRightPlayerId(nextValue)
    onChangePlayers(leftPlayerId, nextValue)
  }

  return (
    <section className="theme-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-4 border-b border-[rgba(54,6,77,0.12)] pb-6">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--theme-text-soft)]">
            {t.navigation.headToHead}
          </p>
          <h2 className="theme-heading mt-2 font-display text-4xl font-bold tracking-[-0.04em] md:text-5xl">
            {t.headToHead.title}
          </h2>
          <p className="theme-copy mt-2 font-data text-base">{t.headToHead.subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="theme-label flex flex-col gap-2 text-sm font-medium">
            <span className="font-display text-base font-semibold">{t.headToHead.playerA}</span>
            <select
              value={effectiveLeftPlayerId ?? ''}
              onChange={(event) => handleLeftChange(event.target.value)}
              className="theme-input font-data rounded-2xl border px-4 py-3 outline-none transition"
            >
              <option value="">{t.headToHead.selectPlayer}</option>
              {selectablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

          <label className="theme-label flex flex-col gap-2 text-sm font-medium">
            <span className="font-display text-base font-semibold">{t.headToHead.playerB}</span>
            <select
              value={effectiveRightPlayerId ?? ''}
              onChange={(event) => handleRightChange(event.target.value)}
              className="theme-input font-data rounded-2xl border px-4 py-3 outline-none transition"
            >
              <option value="">{t.headToHead.selectPlayer}</option>
              {selectablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {!effectiveLeftPlayerId || !effectiveRightPlayerId ? (
        <div className="theme-copy mt-6 font-data text-base">{t.headToHead.choosePlayers}</div>
      ) : effectiveLeftPlayerId === effectiveRightPlayerId ? (
        <div className="theme-copy mt-6 font-data text-base">{t.headToHead.samePlayer}</div>
      ) : loading ? (
        <div className="theme-copy mt-6 font-data text-base">{t.headToHead.loading}</div>
      ) : error ? (
        <div className="mt-6 rounded-3xl bg-[var(--theme-red-soft)] px-4 py-4 text-sm text-[var(--theme-red)]">
          {error}
        </div>
      ) : !detail || detail.gamesPlayed === 0 ? (
        <div className="theme-copy mt-6 font-data text-base">{t.headToHead.noGames}</div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              [`${detail.leftPlayerName} ${t.statistics.score}`, formatScore(detail.leftScore)],
              [`${detail.rightPlayerName} ${t.statistics.score}`, formatScore(detail.rightScore)],
              [t.statistics.gamesPlayed, String(detail.gamesPlayed)],
              [t.statistics.draws, String(detail.draws)],
              [t.headToHead.wins(detail.leftPlayerName), String(detail.leftWins)],
              [t.headToHead.wins(detail.rightPlayerName), String(detail.rightWins)],
              [t.statistics.whiteBlack, `${detail.leftWhiteGames}/${detail.leftBlackGames}`],
              [t.headToHead.lastMeeting, detail.lastPlayedAt ? formatDateTime(detail.lastPlayedAt) : '—'],
            ].map(([label, value]) => (
              <article key={label} className="theme-muted-panel min-w-0 rounded-3xl px-4 py-4">
                <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                  {label}
                </p>
                <p className="theme-heading mt-2 break-words font-display text-2xl font-semibold">
                  {value}
                </p>
              </article>
            ))}
          </div>

          <div className="theme-muted-panel min-w-0 rounded-3xl px-5 py-4">
            <h3 className="theme-heading font-display text-2xl font-semibold">
              {t.headToHead.tournamentMeetings}
            </h3>

            <div className="mt-4 space-y-4">
              {detail.tournaments.map((tournament) => (
                <article
                  key={tournament.tournamentId}
                  className="min-w-0 rounded-3xl border border-[rgba(54,6,77,0.12)] bg-[var(--theme-surface)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="theme-heading break-words font-display text-xl font-semibold">
                        {tournament.tournamentName}
                      </p>
                      <p className="theme-copy mt-1 break-words font-data text-sm">
                        {formatDateTime(tournament.updatedAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-xl font-bold text-[var(--theme-red)]">
                        {formatScore(tournament.leftScore)} : {formatScore(tournament.rightScore)}
                      </p>
                      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                        {detail.leftPlayerName} vs {detail.rightPlayerName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {tournament.matches.map((match) => (
                      <div
                        key={`${tournament.tournamentId}-${match.round}-${match.board}`}
                        className="rounded-2xl bg-[var(--theme-cream)] px-4 py-3"
                      >
                        <p className="theme-heading break-words font-display text-base font-semibold">
                          {t.statistics.roundShort(match.round)} · {t.pairings.board} {match.board}
                        </p>
                        <p className="theme-copy mt-1 break-words font-data text-sm">
                          {detail.leftPlayerName} ({match.leftColor}) {formatScore(match.leftPoints)} - {formatScore(match.rightPoints)} {detail.rightPlayerName} ({match.rightColor})
                        </p>
                        <p className="theme-copy mt-1 break-words font-data text-sm">
                          {t.pairings.result}: {match.result ?? t.common.pending}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
