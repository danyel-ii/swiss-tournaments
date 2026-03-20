import type { Tournament } from '../types/tournament'
import { useI18n } from '../i18n'

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
  const { t } = useI18n()
  const inSetup = tournament.status === 'setup'
  const canStart =
    inSetup &&
    tournament.players.length >= 2 &&
    tournament.totalRounds >= 1 &&
    tournament.totalRounds <= 20
  const canExport =
    tournament.players.length > 0 || tournament.matches.length > 0

  return (
    <section className="theme-panel rounded-3xl p-6">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="theme-label flex flex-col gap-2 text-sm font-medium">
            <span className="font-display text-base font-semibold">{t.controls.tournamentName}</span>
            <input
              type="text"
              value={tournament.name}
              disabled={!inSetup}
              onChange={(event) => onNameChange(event.target.value)}
              className="theme-input font-data rounded-2xl border px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>

          <label className="theme-label flex flex-col gap-2 text-sm font-medium">
            <span className="font-display text-base font-semibold">{t.controls.totalRounds}</span>
            <input
              type="number"
              min={1}
              max={20}
              value={tournament.totalRounds}
              disabled={!inSetup}
              onChange={(event) => onRoundsChange(Number(event.target.value))}
              className="theme-input font-data rounded-2xl border px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
        </div>

        {roundsError ? <p className="font-data text-sm text-[var(--theme-red)]">{roundsError}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            className="theme-button-plum font-display rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none disabled:cursor-not-allowed"
          >
            {t.controls.startTournament}
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={!canExport}
            className="theme-button-aqua font-display rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none disabled:cursor-not-allowed"
          >
            {t.controls.exportReport}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="theme-button-red font-display rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none"
          >
            {t.controls.resetTournament}
          </button>
        </div>
      </div>
    </section>
  )
}
