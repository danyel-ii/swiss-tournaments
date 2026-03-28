import { useMemo, useState } from 'react'
import { useI18n } from '../useI18n'
import { formatDateTime, formatScore } from '../utils/format'
import type { PlayerStatsDetail, PlayerStatsSummary } from '../types/library'

interface StatisticsViewProps {
  players: PlayerStatsSummary[]
  detail: PlayerStatsDetail | null
  loading: boolean
  deleting: boolean
  error: string | null
  onSelectPlayer: (playerId: string | null) => void
  onDeletePlayer: (playerId: string) => Promise<void>
}

export function StatisticsView({
  players,
  detail,
  loading,
  deleting,
  error,
  onSelectPlayer,
  onDeletePlayer,
}: StatisticsViewProps) {
  const { t } = useI18n()
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const effectiveSelectedPlayerId = detail?.summary.playerId ?? selectedPlayerId ?? players[0]?.playerId ?? null

  const selectedSummary = useMemo(
    () => players.find((entry) => entry.playerId === effectiveSelectedPlayerId) ?? players[0] ?? null,
    [effectiveSelectedPlayerId, players],
  )

  return (
    <section className="theme-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-4 border-b border-[rgba(54,6,77,0.12)] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--theme-text-soft)]">
            {t.navigation.statistics}
          </p>
          <h2 className="theme-heading mt-2 font-display text-4xl font-bold tracking-[-0.04em] md:text-5xl">
            {t.statistics.title}
          </h2>
          <p className="theme-copy mt-2 font-data text-base">
            {t.statistics.subtitle}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="theme-copy mt-6 font-data text-base">{t.statistics.loading}</div>
      ) : error ? (
        <div className="mt-6 rounded-3xl bg-[var(--theme-red-soft)] px-4 py-4 text-sm text-[var(--theme-red)]">
          {error}
        </div>
      ) : players.length === 0 ? (
        <div className="theme-copy mt-6 font-data text-base">{t.statistics.empty}</div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            {players.map((player) => {
              const isSelected = player.playerId === effectiveSelectedPlayerId

              return (
                <button
                  key={player.playerId}
                  type="button"
                  onClick={() => {
                    setSelectedPlayerId(player.playerId)
                    onSelectPlayer(player.playerId)
                  }}
                  className={`w-full rounded-3xl border px-5 py-4 text-left transition ${
                    isSelected
                      ? 'border-[var(--theme-aqua)] bg-[var(--theme-aqua-soft)]'
                      : 'border-[var(--theme-border)] bg-[var(--theme-surface)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="theme-heading truncate font-display text-2xl font-semibold">
                        {player.name}
                      </p>
                      <p className="theme-copy mt-1 font-data text-sm">
                        {t.statistics.tournamentsPlayed}: {player.tournamentsPlayed} · {t.statistics.gamesPlayed}:{' '}
                        {player.gamesPlayed}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-3xl font-bold text-[var(--theme-red)]">
                        {formatScore(player.totalScore)}
                      </p>
                      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                        {t.statistics.score}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="space-y-6">
            {selectedSummary ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    [t.statistics.wins, selectedSummary.wins],
                    [t.statistics.draws, selectedSummary.draws],
                    [t.statistics.losses, selectedSummary.losses],
                    [t.statistics.byes, selectedSummary.byes],
                    [t.statistics.tournamentsPlayed, selectedSummary.tournamentsPlayed],
                    [t.statistics.gamesPlayed, selectedSummary.gamesPlayed],
                  ].map(([label, value]) => (
                    <article
                      key={label}
                      className="theme-muted-panel rounded-3xl px-4 py-4"
                    >
                      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                        {label}
                      </p>
                      <p className="theme-heading mt-2 font-display text-3xl font-semibold">
                        {value}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="theme-muted-panel rounded-3xl px-5 py-4">
                  <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                    {t.statistics.lastPlayed}
                  </p>
                  <p className="theme-heading mt-2 font-display text-xl font-semibold">
                    {selectedSummary.lastPlayedAt ? formatDateTime(selectedSummary.lastPlayedAt) : '—'}
                  </p>
                </div>

                <div className="theme-muted-panel rounded-3xl px-5 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <h3 className="theme-heading font-display text-2xl font-semibold">
                      {t.statistics.historyTitle}
                    </h3>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => {
                        const nextSelected =
                          players.find((entry) => entry.playerId !== selectedSummary.playerId)?.playerId ??
                          null
                        const confirmed = window.confirm(
                          t.statistics.deletePlayerConfirm(selectedSummary.name),
                        )

                        if (!confirmed) {
                          return
                        }

                        void onDeletePlayer(selectedSummary.playerId).then(() => {
                          setSelectedPlayerId(nextSelected)
                          onSelectPlayer(nextSelected)
                        })
                      }}
                      className="rounded-full bg-[var(--theme-red-soft)] px-4 py-3 font-display text-sm font-semibold text-[var(--theme-red)] transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t.statistics.deletePlayer}
                    </button>
                  </div>

                  {detail?.tournaments.length ? (
                    <div className="mt-4 space-y-3">
                      {detail.tournaments.map((tournament) => (
                        <article
                          key={tournament.tournamentId}
                          className="rounded-3xl border border-[rgba(54,6,77,0.12)] bg-[var(--theme-surface)] px-4 py-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="theme-heading font-display text-xl font-semibold">
                                {tournament.tournamentName}
                              </p>
                              <p className="theme-copy mt-1 font-data text-sm">
                                {formatDateTime(tournament.updatedAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-display text-2xl font-bold text-[var(--theme-red)]">
                                {formatScore(tournament.score)}
                              </p>
                              <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                                {t.statistics.score}
                              </p>
                            </div>
                          </div>
                          <p className="theme-copy mt-3 font-data text-sm">
                            {t.statistics.wins}: {tournament.wins} · {t.statistics.draws}: {tournament.draws} ·{' '}
                            {t.statistics.losses}: {tournament.losses} · {t.statistics.byes}: {tournament.byes}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="theme-copy mt-4 font-data text-sm">{t.statistics.noHistory}</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
