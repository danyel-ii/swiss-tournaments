import type { Tournament } from '../types/tournament'

interface TournamentControlsProps {
  tournament: Tournament
  roundsError: string | null
  onNameChange: (value: string) => void
  onRoundsChange: (value: number) => void
  onStart: () => void
  onReset: () => void
}

export function TournamentControls({
  tournament,
  roundsError,
  onNameChange,
  onRoundsChange,
  onStart,
  onReset,
}: TournamentControlsProps) {
  const inSetup = tournament.status === 'setup'
  const canStart =
    inSetup &&
    tournament.players.length >= 2 &&
    tournament.totalRounds >= 1 &&
    tournament.totalRounds <= 20

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_18px_60px_rgba(2,6,23,0.3)] backdrop-blur-xl">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Tournament name
            <input
              type="text"
              value={tournament.name}
              disabled={!inSetup}
              onChange={(event) => onNameChange(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25 disabled:cursor-not-allowed disabled:bg-slate-900/50 disabled:text-slate-500"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Total rounds
            <input
              type="number"
              min={1}
              max={20}
              value={tournament.totalRounds}
              disabled={!inSetup}
              onChange={(event) => onRoundsChange(Number(event.target.value))}
              className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25 disabled:cursor-not-allowed disabled:bg-slate-900/50 disabled:text-slate-500"
            />
          </label>
        </div>

        {roundsError ? <p className="text-sm text-rose-300">{roundsError}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            Start Tournament
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-white/12 bg-slate-950/30 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-rose-300/60 hover:text-rose-200 focus:outline-none focus:ring-2 focus:ring-white/10"
          >
            Reset Tournament
          </button>
        </div>
      </div>
    </section>
  )
}
