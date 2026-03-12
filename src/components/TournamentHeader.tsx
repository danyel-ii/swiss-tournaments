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
    <header className="rounded-3xl bg-white px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-slate-900">
            Swiss Chess Tournament
          </h1>
          <p className="font-data mt-1 text-sm text-slate-500">
            {tournament.players.length} players ready to play
          </p>
        </div>

        <div className="inline-flex self-start rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
          {statusLabel}
        </div>
      </div>
    </header>
  )
}
