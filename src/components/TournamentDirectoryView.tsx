import { useMemo } from 'react'
import { useI18n } from '../useI18n'
import { formatDateTime } from '../utils/format'
import type { Tournament } from '../types/tournament'

interface TournamentDirectoryViewProps {
  tournaments: Tournament[]
  activeTournamentId: string
  disabled: boolean
  onCreateTournament: () => void
  onOpenTournament: (tournamentId: string) => void
  onDeleteTournament: (tournamentId: string) => Promise<void>
  onClearAllData: () => Promise<void>
}

export function TournamentDirectoryView({
  tournaments,
  activeTournamentId,
  disabled,
  onCreateTournament,
  onOpenTournament,
  onDeleteTournament,
  onClearAllData,
}: TournamentDirectoryViewProps) {
  const { t } = useI18n()
  const orderedTournaments = useMemo(
    () =>
      [...tournaments].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    [tournaments],
  )

  return (
    <section className="theme-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-4 border-b border-[rgba(54,6,77,0.12)] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--theme-text-soft)]">
            {t.tournaments.directoryEyebrow}
          </p>
          <h2 className="theme-heading mt-2 font-display text-4xl font-bold tracking-[-0.04em] md:text-5xl">
            {t.tournaments.title}
          </h2>
          <p className="theme-copy mt-2 font-data text-base">
            {t.tournaments.subtitle(tournaments.length)}
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateTournament}
          disabled={disabled}
          className="theme-button-plum rounded-full px-5 py-3 font-display text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t.tournaments.createTournament}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const confirmed = window.confirm(t.tournaments.deleteAllDataConfirm)

            if (!confirmed) {
              return
            }

            void onClearAllData()
          }}
          className="rounded-full bg-[var(--theme-red-soft)] px-5 py-3 font-display text-sm font-semibold text-[var(--theme-red)] transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t.tournaments.deleteAllData}
        </button>
        <p className="theme-copy max-w-2xl self-center font-data text-sm">
          {t.tournaments.deleteAllDataHelp}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {orderedTournaments.map((tournament) => {
          const isActive = tournament.id === activeTournamentId
          const statusLabel = t.header.statusLabel(
            tournament.status,
            tournament.currentRound,
            tournament.totalRounds,
          )

          return (
            <article
              key={tournament.id}
              className={`rounded-3xl border p-5 ${
                isActive
                  ? 'border-[var(--theme-aqua)] bg-[var(--theme-aqua-soft)]'
                  : 'border-[var(--theme-border)] bg-[var(--theme-surface)]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="theme-heading truncate font-display text-2xl font-semibold tracking-[-0.03em]">
                    {tournament.name}
                  </h3>
                  <p className="theme-copy mt-2 font-data text-xs break-all">
                    {t.tournaments.tournamentId(tournament.id)}
                  </p>
                </div>

                {isActive ? (
                  <span className="rounded-full bg-[var(--theme-plum)] px-3 py-1 text-[11px] font-display font-semibold uppercase tracking-[0.18em] text-[var(--theme-cream)]">
                    {t.tournaments.active}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--theme-plum-soft)] px-3 py-2 text-xs font-semibold text-[var(--theme-plum)]">
                  {statusLabel}
                </span>
                <span className="rounded-full bg-[var(--theme-red-soft)] px-3 py-2 text-xs font-semibold text-[var(--theme-red)]">
                  {t.tournaments.players(tournament.players.length)}
                </span>
              </div>

              <p className="theme-copy mt-4 font-data text-sm">
                {t.tournaments.updatedAt(formatDateTime(tournament.updatedAt))}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onOpenTournament(tournament.id)}
                  className="theme-button-aqua rounded-full px-4 py-3 font-display text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isActive ? t.tournaments.openCurrent : t.tournaments.openTournament}
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const confirmed = window.confirm(t.tournaments.deleteTournamentConfirm(tournament.name))

                    if (!confirmed) {
                      return
                    }

                    void onDeleteTournament(tournament.id)
                  }}
                  className="rounded-full bg-[var(--theme-red-soft)] px-4 py-3 font-display text-sm font-semibold text-[var(--theme-red)] transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.tournaments.deleteTournament}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
