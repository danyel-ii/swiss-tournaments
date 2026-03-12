import { formatStatusLabel } from '../utils/format'
import type { Tournament } from '../types/tournament'

interface TournamentHeaderProps {
  tournament: Tournament
}

export function TournamentHeader({ tournament }: TournamentHeaderProps) {
  const statusLabel = formatStatusLabel(
    tournament.status,
    tournament.currentRound,
    tournament.totalRounds,
  )

  return (
    <header className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">
            Tournament Desk
          </p>
          <h1 className="mt-2 font-serif text-3xl text-slate-900 md:text-4xl">
            Swiss Chess Tournament
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {tournament.players.length} players registered
          </p>
        </div>

        <div className="inline-flex items-center gap-3 self-start rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-600" />
          {statusLabel}
        </div>
      </div>
    </header>
  )
}
