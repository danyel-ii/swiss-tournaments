import type { Tournament } from '../types/tournament'
import { PawnIcon, ScrollIcon } from './GamePieces'

interface TournamentControlsProps {
  tournament: Tournament
  roundsError: string | null
  onNameChange: (value: string) => void
  onRoundsChange: (value: number) => void
  onStart: () => void
  onExport: () => void
  onReset: () => void
}

export function TournamentControls({
  tournament,
  roundsError,
  onNameChange,
  onRoundsChange,
  onStart,
  onExport,
  onReset,
}: TournamentControlsProps) {
  const inSetup = tournament.status === 'setup'
  const canStart =
    inSetup &&
    tournament.players.length >= 2 &&
    tournament.totalRounds >= 1 &&
    tournament.totalRounds <= 20
  const canExport =
    tournament.players.length > 0 || tournament.matches.length > 0

  return (
    <section className="rounded-[32px] border border-emerald-900/12 bg-[linear-gradient(180deg,_#2f7b6e_0%,_#255f66_100%)] p-6 shadow-[inset_0_2px_0_rgba(255,255,255,0.18),0_18px_40px_rgba(15,23,42,0.18)]">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-emerald-50">
            <span className="font-display inline-flex items-center gap-2 text-base font-bold">
              <ScrollIcon className="h-5 w-5" />
              Tournament scroll
            </span>
            <input
              type="text"
              value={tournament.name}
              disabled={!inSetup}
              onChange={(event) => onNameChange(event.target.value)}
              className="font-data rounded-[22px] border-2 border-[#d8b15d] bg-[linear-gradient(180deg,_#fff7db_0%,_#f3e2a7_100%)] px-4 py-3 text-[#284b4f] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-[#dbcfa4] disabled:text-[#6a6a5c]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-emerald-50">
            <span className="font-display inline-flex items-center gap-2 text-base font-bold">
              <ScrollIcon className="h-5 w-5" />
              Round scroll
            </span>
            <input
              type="number"
              min={1}
              max={20}
              value={tournament.totalRounds}
              disabled={!inSetup}
              onChange={(event) => onRoundsChange(Number(event.target.value))}
              className="font-data rounded-[22px] border-2 border-[#d8b15d] bg-[linear-gradient(180deg,_#fff7db_0%,_#f3e2a7_100%)] px-4 py-3 text-[#284b4f] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-[#dbcfa4] disabled:text-[#6a6a5c]"
            />
          </label>
        </div>

        {roundsError ? <p className="font-data text-sm text-rose-100">{roundsError}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            className="font-display inline-flex items-center justify-center gap-2 rounded-[22px] border border-emerald-800/25 bg-[linear-gradient(180deg,_#69d37e_0%,_#3aa055_100%)] px-5 py-3 text-sm font-bold text-emerald-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_18px_rgba(24,105,54,0.24)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            <PawnIcon className="h-4 w-4" />
            Start Tournament
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={!canExport}
            className="font-display inline-flex items-center justify-center gap-2 rounded-[22px] border border-[#8a6230]/25 bg-[linear-gradient(180deg,_#e8c774_0%,_#b88739_100%)] px-5 py-3 text-sm font-bold text-[#52350f] shadow-[inset_0_2px_0_rgba(255,255,255,0.4),0_8px_18px_rgba(113,83,28,0.22)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900/30 disabled:text-slate-500"
          >
            <ScrollIcon className="h-4 w-4" />
            Export Report
          </button>

          <button
            type="button"
            onClick={onReset}
            className="font-display inline-flex items-center justify-center gap-2 rounded-[22px] border border-sky-900/20 bg-[linear-gradient(180deg,_#8bc7ea_0%,_#5b9cd0_100%)] px-5 py-3 text-sm font-bold text-sky-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.42),0_8px_18px_rgba(43,105,163,0.22)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-sky-100"
          >
            <PawnIcon className="h-4 w-4" />
            Reset Tournament
          </button>
        </div>
      </div>
    </section>
  )
}
