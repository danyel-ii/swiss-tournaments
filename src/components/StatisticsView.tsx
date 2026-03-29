import { useMemo, useState } from 'react'
import { useI18n } from '../useI18n'
import { formatDateTime, formatPercent, formatScore } from '../utils/format'
import type { PlayerStatsDetail, PlayerStatsSummary, PlayerTournamentStat } from '../types/library'

interface StatisticsViewProps {
  players: PlayerStatsSummary[]
  detail: PlayerStatsDetail | null
  loading: boolean
  deleting: boolean
  error: string | null
  onSelectPlayer: (playerId: string | null) => void
  onDeletePlayer: (playerId: string) => Promise<void>
  onExportPlayer: (detail: PlayerStatsDetail) => void
}

function getTournamentStatusLabel(
  tournament: PlayerTournamentStat,
  t: ReturnType<typeof useI18n>['t'],
): string {
  if (tournament.status === 'completed') {
    return t.statistics.completed
  }

  if (tournament.status === 'in_progress') {
    return t.statistics.inProgress
  }

  return t.statistics.setup
}

export function StatisticsView({
  players,
  detail,
  loading,
  deleting,
  error,
  onSelectPlayer,
  onDeletePlayer,
  onExportPlayer,
}: StatisticsViewProps) {
  const { t } = useI18n()
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [expandedTournamentIds, setExpandedTournamentIds] = useState<string[]>([])
  const effectiveSelectedPlayerId = detail?.summary.playerId ?? selectedPlayerId ?? players[0]?.playerId ?? null
  const showMobileDetail = selectedPlayerId !== null

  const selectedSummary = useMemo(
    () => players.find((entry) => entry.playerId === effectiveSelectedPlayerId) ?? players[0] ?? null,
    [effectiveSelectedPlayerId, players],
  )
  const orderedPlayers = useMemo(() => {
    if (!effectiveSelectedPlayerId) {
      return players
    }

    const selectedIndex = players.findIndex((entry) => entry.playerId === effectiveSelectedPlayerId)

    if (selectedIndex <= 0) {
      return players
    }

    const selectedPlayer = players[selectedIndex]

    return [selectedPlayer, ...players.slice(0, selectedIndex), ...players.slice(selectedIndex + 1)]
  }, [effectiveSelectedPlayerId, players])

  const summaryCards = selectedSummary
    ? [
        [t.statistics.score, formatScore(selectedSummary.totalScore)],
        [t.statistics.scorePercentage, formatPercent(selectedSummary.scorePercentage)],
        [t.statistics.gamesPlayed, String(selectedSummary.gamesPlayed)],
        [t.statistics.tournamentsPlayed, String(selectedSummary.tournamentsPlayed)],
        [t.statistics.completedVsPartial, `${selectedSummary.completedTournaments} / ${selectedSummary.partialTournaments}`],
        [t.statistics.undefeatedTournaments, String(selectedSummary.undefeatedTournaments)],
        [t.statistics.wins, String(selectedSummary.wins)],
        [t.statistics.draws, String(selectedSummary.draws)],
        [t.statistics.losses, String(selectedSummary.losses)],
        [t.statistics.byes, String(selectedSummary.byes)],
        [t.statistics.whiteBlack, `${selectedSummary.whiteGames} / ${selectedSummary.blackGames}`],
        [t.statistics.colorImbalance, String(selectedSummary.colorImbalance)],
        [t.statistics.averageBuchholz, formatScore(selectedSummary.averageBuchholz)],
        [t.statistics.bestBuchholz, formatScore(selectedSummary.bestBuchholz)],
        [t.statistics.latestBuchholz, selectedSummary.latestBuchholz === null ? '—' : formatScore(selectedSummary.latestBuchholz)],
        [t.statistics.lateEntries, String(selectedSummary.lateEntries)],
        [t.statistics.dropouts, String(selectedSummary.dropouts)],
        [t.statistics.longestColorStreak, `${t.statistics.white}: ${selectedSummary.longestWhiteStreak} · ${t.statistics.black}: ${selectedSummary.longestBlackStreak}`],
      ]
    : []

  const toggleTournamentHistory = (tournamentId: string) => {
    setExpandedTournamentIds((current) =>
      current.includes(tournamentId)
        ? current.filter((id) => id !== tournamentId)
        : [...current, tournamentId],
    )
  }

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
          <div className={`space-y-3 min-w-0 ${showMobileDetail ? 'hidden xl:block' : ''}`}>
            {orderedPlayers.map((player) => {
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
                  <div className="flex items-start justify-between gap-4 min-w-0">
                    <div className="min-w-0">
                      <p className="theme-heading truncate font-display text-2xl font-semibold">
                        {player.name}
                      </p>
                      <p className="theme-copy mt-1 break-words font-data text-sm">
                        {t.statistics.tournamentsPlayed}: {player.tournamentsPlayed} · {t.statistics.gamesPlayed}: {player.gamesPlayed}
                      </p>
                      <p className="theme-copy mt-1 break-words font-data text-sm">
                        {t.statistics.averageBuchholz}: {formatScore(player.averageBuchholz)} · {t.statistics.whiteBlack}: {player.whiteGames}/{player.blackGames}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
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

          <div className={`min-w-0 space-y-6 ${showMobileDetail ? 'block' : 'hidden xl:block'}`}>
            {selectedSummary && detail ? (
              <>
                <div className="xl:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlayerId(null)
                      onSelectPlayer(null)
                    }}
                    className="rounded-full bg-[var(--theme-surface)] px-4 py-2 font-display text-sm font-semibold transition"
                  >
                    {t.statistics.backToPlayers}
                  </button>
                </div>

                <div className="theme-muted-panel min-w-0 rounded-3xl px-5 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                        {t.statistics.managePlayer}
                      </p>
                      <p className="theme-heading mt-2 break-words font-display text-xl font-semibold">
                        {selectedSummary.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onExportPlayer(detail)}
                      className="rounded-full bg-[var(--theme-aqua-soft)] px-4 py-3 font-display text-sm font-semibold text-[var(--theme-plum)] transition"
                    >
                      {t.statistics.exportPlayerStats}
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => {
                        const nextSelected =
                          players.find((entry) => entry.playerId !== selectedSummary.playerId)?.playerId ?? null
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
                  <p className="theme-copy mt-3 break-words font-data text-sm">
                    {t.statistics.byeHistory}: {detail.byeHistory.length}
                  </p>
                  <p className="theme-copy mt-1 break-words font-data text-sm">
                    {t.statistics.headToHeadTitle}: {detail.headToHead.length}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="theme-muted-panel min-w-0 rounded-3xl px-5 py-4">
                    <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                      {t.statistics.lastPlayed}
                    </p>
                    <p className="theme-heading mt-2 break-words font-display text-xl font-semibold">
                      {selectedSummary.lastPlayedAt ? formatDateTime(selectedSummary.lastPlayedAt) : '—'}
                    </p>
                    <p className="theme-copy mt-3 break-words font-data text-sm">
                      {t.statistics.winRate}: {formatPercent(selectedSummary.winRate)} · {t.statistics.drawRate}: {formatPercent(selectedSummary.drawRate)} · {t.statistics.lossRate}: {formatPercent(selectedSummary.lossRate)}
                    </p>
                    <p className="theme-copy mt-1 break-words font-data text-sm">
                      {t.statistics.winRateByColor}: {t.statistics.white} {formatPercent(selectedSummary.winRateAsWhite)} · {t.statistics.black} {formatPercent(selectedSummary.winRateAsBlack)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {summaryCards.map(([label, value]) => (
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
                    {t.statistics.historyTitle}
                  </h3>

                  {detail.tournaments.length ? (
                    <div className="mt-4 space-y-4">
                      {detail.tournaments.map((tournament) => {
                        const isExpanded = expandedTournamentIds.includes(tournament.tournamentId)

                        return (
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
                                  {formatDateTime(tournament.updatedAt)} · {getTournamentStatusLabel(tournament, t)}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="font-display text-2xl font-bold text-[var(--theme-red)]">
                                  {formatScore(tournament.score)}
                                </p>
                                <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                                  {t.statistics.score}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                              <p className="theme-copy break-words font-data text-sm">
                                {t.statistics.rank}: {tournament.finalRank} / {tournament.playerCount} · {t.statistics.buchholz}: {formatScore(tournament.buchholz)}
                              </p>
                              <button
                                type="button"
                                onClick={() => toggleTournamentHistory(tournament.tournamentId)}
                                className="rounded-full bg-[var(--theme-surface-strong)] px-4 py-2 font-display text-sm font-semibold transition"
                              >
                                {isExpanded ? t.common.hide : t.common.open}
                              </button>
                            </div>

                            {isExpanded ? (
                              <>
                                <div className="mt-4 grid gap-3 md:grid-cols-4">
                                  {[
                                    [t.statistics.rank, `${tournament.finalRank} / ${tournament.playerCount}`],
                                    [t.statistics.seedVsPlacement, `${tournament.seed} → ${tournament.finalRank}`],
                                    [t.statistics.buchholz, formatScore(tournament.buchholz)],
                                    [t.statistics.scorePercentage, formatPercent(tournament.scorePercentage)],
                                    [t.statistics.whiteBlack, `${tournament.whiteGames} / ${tournament.blackGames}`],
                                    [t.statistics.colorImbalance, String(tournament.colorImbalance)],
                                    [t.statistics.entryDrop, `${tournament.enteredRound} / ${tournament.droppedAfterRound ?? '—'}`],
                                    [t.statistics.undefeated, tournament.undefeated ? t.common.yes : t.common.no],
                                  ].map(([label, value]) => (
                                    <div key={label}>
                                      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                                        {label}
                                      </p>
                                      <p className="theme-heading mt-1 break-words font-display text-lg font-semibold">
                                        {value}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-4">
                                  <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                                    {t.statistics.roundProgression}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {tournament.rounds.map((round) => (
                                      <span
                                        key={`${tournament.tournamentId}-round-${round.round}`}
                                        className="max-w-full break-words rounded-3xl bg-[var(--theme-aqua-soft)] px-3 py-1.5 font-data text-sm text-[var(--theme-plum)]"
                                      >
                                        {t.statistics.roundShort(round.round)} {formatScore(round.score)} / {formatScore(round.buchholz)} / #{round.rank}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                                    {t.statistics.opponents}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {tournament.opponents.map((opponent, index) => (
                                      <span
                                        key={`${tournament.tournamentId}-opp-${index}`}
                                        className="max-w-full break-words rounded-3xl bg-[var(--theme-surface-strong)] px-3 py-1.5 font-data text-sm text-[var(--theme-text)]"
                                      >
                                        {t.statistics.roundShort(opponent.round)} · {opponent.color ?? '—'} · {opponent.opponentName} · {opponent.result ?? t.common.pending}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </>
                            ) : null}
                          </article>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="theme-copy mt-4 font-data text-sm">{t.statistics.noHistory}</p>
                  )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="theme-muted-panel min-w-0 rounded-3xl px-5 py-4">
                    <h3 className="theme-heading font-display text-2xl font-semibold">
                      {t.statistics.headToHeadTitle}
                    </h3>
                    {detail.headToHead.length ? (
                      <div className="mt-4 space-y-3">
                        {detail.headToHead.map((entry, index) => (
                          <article
                            key={`${entry.opponentPlayerId ?? entry.opponentName}-${index}`}
                            className="min-w-0 rounded-3xl border border-[rgba(54,6,77,0.12)] bg-[var(--theme-surface)] px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-3 min-w-0">
                              <div className="min-w-0">
                                <p className="theme-heading break-words font-display text-lg font-semibold">
                                  {entry.opponentName}
                                </p>
                                <p className="theme-copy mt-1 break-words font-data text-sm">
                                  {t.statistics.tournamentsPlayed}: {entry.tournamentsPlayed} · {t.statistics.gamesPlayed}: {entry.gamesPlayed}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="font-display text-xl font-bold text-[var(--theme-red)]">
                                  {formatScore(entry.score)}
                                </p>
                                <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--theme-text-soft)]">
                                  {t.statistics.score}
                                </p>
                              </div>
                            </div>
                            <p className="theme-copy mt-3 break-words font-data text-sm">
                              {t.statistics.wins}: {entry.wins} · {t.statistics.draws}: {entry.draws} · {t.statistics.losses}: {entry.losses}
                            </p>
                            <p className="theme-copy mt-1 break-words font-data text-sm">
                              {t.statistics.whiteBlack}: {entry.whiteGames}/{entry.blackGames} · {t.statistics.lastPlayed}: {entry.lastPlayedAt ? formatDateTime(entry.lastPlayedAt) : '—'}
                            </p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="theme-copy mt-4 font-data text-sm">{t.statistics.noHeadToHead}</p>
                    )}
                  </div>

                  <div className="theme-muted-panel min-w-0 rounded-3xl px-5 py-4">
                    <h3 className="theme-heading font-display text-2xl font-semibold">
                      {t.statistics.byeHistory}
                    </h3>
                    {detail.byeHistory.length ? (
                      <div className="mt-4 space-y-3">
                        {detail.byeHistory.map((entry) => (
                          <article
                            key={`${entry.tournamentId}-${entry.round}`}
                            className="min-w-0 rounded-3xl border border-[rgba(54,6,77,0.12)] bg-[var(--theme-surface)] px-4 py-4"
                          >
                            <p className="theme-heading break-words font-display text-lg font-semibold">
                              {entry.tournamentName}
                            </p>
                            <p className="theme-copy mt-1 break-words font-data text-sm">
                              {formatDateTime(entry.updatedAt)} · {t.statistics.roundShort(entry.round)}
                            </p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="theme-copy mt-4 font-data text-sm">{t.statistics.noByes}</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="theme-copy rounded-3xl bg-[var(--theme-surface)] px-4 py-6 font-data text-sm xl:hidden">
                {t.statistics.selectPlayer}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
