import { AvatarBadge, PawnIcon, ShieldIcon } from './GamePieces'
import type { Player, TournamentStatus } from '../types/tournament'
import { useI18n } from '../i18n'

interface PlayerListProps {
  players: Player[]
  status: TournamentStatus
  playerName: string
  error: string | null
  duplicateWarning: string | null
  onPlayerNameChange: (value: string) => void
  onAddPlayer: () => void
  onRemovePlayer: (playerId: string) => void
}

export function PlayerList({
  players,
  status,
  playerName,
  error,
  duplicateWarning,
  onPlayerNameChange,
  onAddPlayer,
  onRemovePlayer,
}: PlayerListProps) {
  const { t } = useI18n()
  const inSetup = status === 'setup'

  return (
    <section className="theme-panel rounded-3xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="theme-heading font-display text-2xl font-semibold">{t.players.title}</h2>
          <p className="theme-copy font-data mt-1 text-sm">
            {t.players.subtitle}
          </p>
        </div>
      </div>

      {inSetup ? (
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <label className="theme-label flex-1 text-sm font-medium">
            <span className="font-display">{t.players.playerName}</span>
            <input
              type="text"
              value={playerName}
              onChange={(event) => onPlayerNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onAddPlayer()
                }
              }}
              className="theme-input font-data mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition"
            />
          </label>

          <button
            type="button"
            onClick={onAddPlayer}
            className="theme-button-aqua font-display inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none md:self-end"
          >
            <ShieldIcon className="h-4 w-4" />
            {t.players.addPlayer}
          </button>
        </div>
      ) : null}

      {error ? <p className="font-data mt-3 text-sm text-[var(--theme-red)]">{error}</p> : null}
      {duplicateWarning ? (
        <p className="font-data mt-2 text-sm text-[var(--theme-red)]">{duplicateWarning}</p>
      ) : null}

      {players.length === 0 ? (
        <div className="theme-muted-panel theme-copy font-data mt-6 rounded-3xl px-4 py-8 text-center text-sm">
          {t.players.noPlayers}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {players.map((player) => (
            <article
              key={player.id}
              className="theme-muted-panel flex items-center justify-between gap-4 rounded-3xl px-4 py-3"
            >
              <div className="min-w-0 flex items-center gap-3">
                <AvatarBadge seed={player.seed} />
                <div className="min-w-0">
                  <p className="theme-heading truncate font-display text-lg font-semibold">
                    {player.name}
                  </p>
                  <p className="theme-copy font-data inline-flex max-w-full items-center gap-2 text-sm">
                    <PawnIcon className="h-4 w-4" />
                    {t.players.seed(player.seed)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={!inSetup}
                onClick={() => onRemovePlayer(player.id)}
                className="font-display rounded-full bg-[var(--theme-surface)] px-4 py-2 text-sm font-semibold text-[var(--theme-red)] transition hover:bg-[var(--theme-red-soft)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.players.remove}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
