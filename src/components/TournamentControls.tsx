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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Tournament name
            <input
              type="text"
              value={tournament.name}
              disabled={!inSetup}
              onChange={(event) => onNameChange(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Total rounds
            <input
              type="number"
              min={1}
              max={20}
              value={tournament.totalRounds}
              disabled={!inSetup}
              onChange={(event) => onRoundsChange(Number(event.target.value))}
              className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>
        </div>

        {roundsError ? <p className="text-sm text-rose-600">{roundsError}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Start Tournament
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Reset Tournament
          </button>
        </div>
      </div>
    </section>
  )
}
