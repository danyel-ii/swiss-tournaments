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
    <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.16),_transparent_26%)]" />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Tournament Desk
          </p>
          <h1 className="mt-2 font-sans text-3xl font-black tracking-[-0.04em] text-white md:text-5xl">
            Swiss Chess Tournament
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {tournament.players.length} players registered
          </p>
        </div>

        <div className="relative inline-flex items-center gap-3 self-start rounded-full border border-white/10 bg-slate-950/35 px-4 py-2 text-sm font-medium text-slate-200">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
          {statusLabel}
        </div>
      </div>
    </header>
  )
}
