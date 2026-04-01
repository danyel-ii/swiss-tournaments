import { getPlayersEnteredByRound } from '../core/ranking'
import type { Tournament } from '../types/tournament'
import { useI18n } from '../useI18n'

interface TournamentHeaderProps {
  tournament: Tournament
  username: string
  onLogout: () => void
}

export function TournamentHeader({ tournament, username, onLogout }: TournamentHeaderProps) {
  const { language, setLanguage, t } = useI18n()
  const statusLabel = t.header.statusLabel(
    tournament.status,
    tournament.currentRound,
    tournament.totalRounds,
  )
  const currentPlayers =
    tournament.currentRound > 0
      ? getPlayersEnteredByRound(tournament.players, tournament.currentRound).length
      : tournament.players.length

  return (
    <header className="theme-panel rounded-3xl px-6 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="theme-heading font-display text-3xl font-bold tracking-[-0.03em]">
            {t.header.title}
          </h1>
          <p className="theme-copy font-data mt-1 text-sm">
            {t.header.playersReady(currentPlayers)}
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="theme-copy max-w-full rounded-full bg-[var(--theme-surface)] px-4 py-2 text-sm break-words">
            {t.header.signedInAs(username)}
          </div>

          <label className="theme-copy flex max-w-full flex-wrap items-center gap-2 text-sm">
            <span className="font-display font-semibold">{t.header.languageLabel}</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as typeof language)}
              className="theme-input font-data min-w-0 rounded-full border px-3 py-2 outline-none transition"
            >
              <option value="en">{t.common.english}</option>
              <option value="de">{t.common.german}</option>
            </select>
          </label>

          <div className="inline-flex max-w-full self-start rounded-full bg-[var(--theme-plum-soft)] px-4 py-2 text-sm font-semibold text-[var(--theme-plum)] break-words">
            {statusLabel}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="font-display max-w-full rounded-full bg-[var(--theme-surface)] px-4 py-2 text-sm font-semibold transition break-words"
          >
            {t.header.logout}
          </button>
        </div>
      </div>
    </header>
  )
}
