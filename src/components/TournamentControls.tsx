import type { Tournament } from '../types/tournament'

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
    <section className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="font-display text-base font-semibold">Tournament name</span>
            <input
              type="text"
              value={tournament.name}
              disabled={!inSetup}
              onChange={(event) => onNameChange(event.target.value)}
              className="font-data rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="font-display text-base font-semibold">Total rounds</span>
            <input
              type="number"
              min={1}
              max={20}
              value={tournament.totalRounds}
              disabled={!inSetup}
              onChange={(event) => onRoundsChange(Number(event.target.value))}
              className="font-data rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>
        </div>

        {roundsError ? <p className="font-data text-sm text-rose-500">{roundsError}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            className="font-display rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            Start Tournament
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={!canExport}
            className="font-display rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Export Report
          </button>

          <button
            type="button"
            onClick={onReset}
            className="font-display rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          >
            Reset Tournament
          </button>
        </div>
      </div>
    </section>
  )
}
