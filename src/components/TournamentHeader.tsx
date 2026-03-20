import type { Tournament } from '../types/tournament'
import { useI18n } from '../i18n'

interface TournamentHeaderProps {
  tournament: Tournament
}

export function TournamentHeader({ tournament }: TournamentHeaderProps) {
  const { language, setLanguage, t } = useI18n()
  const statusLabel = t.header.statusLabel(
    tournament.status,
    tournament.currentRound,
    tournament.totalRounds,
  )

  return (
    <header className="theme-panel rounded-3xl px-6 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="theme-heading font-display text-3xl font-bold tracking-[-0.03em]">
            {t.header.title}
          </h1>
          <p className="theme-copy font-data mt-1 text-sm">
            {t.header.playersReady(tournament.players.length)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="theme-copy flex items-center gap-2 text-sm">
            <span className="font-display font-semibold">{t.header.languageLabel}</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as typeof language)}
              className="theme-input font-data rounded-full border px-3 py-2 outline-none transition"
            >
              <option value="en">{t.common.english}</option>
              <option value="de">{t.common.german}</option>
            </select>
          </label>

          <div className="inline-flex self-start rounded-full bg-[var(--theme-plum-soft)] px-4 py-2 text-sm font-semibold text-[var(--theme-plum)]">
            {statusLabel}
          </div>
        </div>
      </div>
    </header>
  )
}
