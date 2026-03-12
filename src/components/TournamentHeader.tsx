import { formatStatusLabel } from '../utils/format'
import { CrownIcon, CrystalIcon } from './GamePieces'
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
    <header className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="relative overflow-hidden rounded-[36px] border border-[#2f6f66]/25 bg-[linear-gradient(180deg,_#fef7d8_0%,_#f4dfb1_100%)] p-6 shadow-[inset_0_2px_0_rgba(255,255,255,0.8),0_18px_36px_rgba(21,58,54,0.18)]">
        <div className="absolute inset-x-12 top-0 h-4 rounded-b-full bg-[#d2b26f]/65" />
        <div className="absolute inset-y-0 left-6 w-px bg-[#cba85f]/35" />
        <div className="absolute inset-y-0 right-6 w-px bg-[#cba85f]/35" />
        <div className="relative flex flex-col items-center text-center">
          <div className="rounded-full bg-amber-200 p-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.7),0_8px_18px_rgba(180,126,31,0.22)]">
            <CrownIcon className="h-8 w-8" />
          </div>
          <p className="font-display mt-4 text-xs font-bold uppercase tracking-[0.36em] text-emerald-700">
            Castle Pennant
          </p>
          <h1 className="font-display mt-2 text-4xl font-extrabold tracking-[-0.05em] text-[#1f4b56] md:text-6xl">
            Swiss Chess Tournament
          </h1>
          <p className="font-display mt-3 text-lg font-semibold text-[#315b53]">
            {tournament.players.length} Brave Contenders Await!
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-sky-700/15 bg-[linear-gradient(180deg,_#8ed0ef_0%,_#5ea9d9_100%)] p-5 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),0_18px_34px_rgba(27,84,120,0.18)]">
        <div className="absolute inset-3 rounded-[26px] border border-white/30" />
        <div className="relative flex h-full flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-xs font-bold uppercase tracking-[0.34em] text-sky-950/75">
              Round Crystal
            </p>
            <CrystalIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold tracking-[-0.04em] text-sky-950">
              {statusLabel}
            </p>
            <p className="font-data mt-2 text-sm text-sky-950/75">
              {tournament.currentRound > 0
                ? `Round ${tournament.currentRound} of ${tournament.totalRounds}`
                : 'Awaiting opening move'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
