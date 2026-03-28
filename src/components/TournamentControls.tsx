import { useState } from 'react'
import type { Tournament } from '../types/tournament'
import { useI18n } from '../useI18n'

interface TournamentControlsProps {
  tournament: Tournament
  roundsError: string | null
  sendingReportEmail: boolean
  onNameChange: (value: string) => void
  onRoundsChange: (value: number) => void
  onStart: () => void
  onExport: () => void
  onEmailReport: () => void
  onReset: () => void
}

export function TournamentControls({
  tournament,
  roundsError,
  sendingReportEmail,
  onNameChange,
  onRoundsChange,
  onStart,
  onExport,
  onEmailReport,
  onReset,
}: TournamentControlsProps) {
  const { t } = useI18n()
  const [draftName, setDraftName] = useState(tournament.name)
  const inSetup = tournament.status === 'setup'
  const canStart =
    inSetup &&
    tournament.players.length >= 2 &&
    tournament.totalRounds >= 1 &&
    tournament.totalRounds <= 20
  const canExport =
    tournament.players.length > 0 || tournament.matches.length > 0
  const canEmailReport = canExport && !sendingReportEmail

  const handleRoundsInputChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '')

    if (!digitsOnly) {
      onRoundsChange(0)
      return
    }

    onRoundsChange(Number(digitsOnly))
  }

  return (
    <section className="theme-panel rounded-3xl p-6">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="theme-label flex flex-col gap-2 text-sm font-medium">
            <span className="font-display text-base font-semibold">{t.controls.tournamentName}</span>
            <input
              type="text"
              value={draftName}
              disabled={!inSetup}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={() => onNameChange(draftName)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.currentTarget.blur()
                }
              }}
              className="theme-input font-data rounded-2xl border px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>

          <label className="theme-label flex flex-col gap-2 text-sm font-medium">
            <span className="font-display text-base font-semibold">{t.controls.totalRounds}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t.controls.decreaseRounds}
                disabled={!inSetup || tournament.totalRounds <= 1}
                onClick={() => onRoundsChange(Math.max(1, tournament.totalRounds - 1))}
                className="theme-button-aqua h-[3.125rem] w-[3.125rem] shrink-0 rounded-2xl text-xl font-semibold transition focus:outline-none disabled:cursor-not-allowed"
              >
                -
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={String(tournament.totalRounds)}
                disabled={!inSetup}
                onChange={(event) => handleRoundsInputChange(event.target.value)}
                className="theme-input font-data min-w-0 flex-1 rounded-2xl border px-4 py-3 text-center outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="button"
                aria-label={t.controls.increaseRounds}
                disabled={!inSetup || tournament.totalRounds >= 20}
                onClick={() => onRoundsChange(Math.min(20, tournament.totalRounds + 1))}
                className="theme-button-aqua h-[3.125rem] w-[3.125rem] shrink-0 rounded-2xl text-xl font-semibold transition focus:outline-none disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
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
            onClick={onEmailReport}
            disabled={!canEmailReport}
            className="theme-button-aqua font-display rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none disabled:cursor-not-allowed"
          >
            {sendingReportEmail ? t.controls.emailReportSending : t.controls.emailReport}
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
