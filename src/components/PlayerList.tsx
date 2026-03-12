import { AvatarBadge, PawnIcon, ShieldIcon } from './GamePieces'
import type { Player, TournamentStatus } from '../types/tournament'

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
  const inSetup = status === 'setup'

  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Player Management</h2>
          <p className="font-data mt-1 text-sm text-slate-500">
            Add at least 2 players to start a tournament.
          </p>
        </div>
      </div>

      {inSetup ? (
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <label className="flex-1 text-sm font-medium text-slate-700">
            <span className="font-display">Player name</span>
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
              className="font-data mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <button
            type="button"
            onClick={onAddPlayer}
            className="font-display inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 md:self-end"
          >
            <ShieldIcon className="h-4 w-4" />
            Add Player
          </button>
        </div>
      ) : null}

      {error ? <p className="font-data mt-3 text-sm text-rose-500">{error}</p> : null}
      {duplicateWarning ? (
        <p className="font-data mt-2 text-sm text-amber-600">{duplicateWarning}</p>
      ) : null}

      {players.length === 0 ? (
        <div className="font-data mt-6 rounded-3xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          No players registered yet.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {players.map((player) => (
            <article
              key={player.id}
              className="flex items-center justify-between gap-4 rounded-3xl bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <AvatarBadge seed={player.seed} />
                <div>
                  <p className="font-display text-lg font-semibold text-slate-900">
                    {player.name}
                  </p>
                  <p className="font-data inline-flex items-center gap-2 text-sm text-slate-500">
                    <PawnIcon className="h-4 w-4" />
                    Seed {player.seed}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={!inSetup}
                onClick={() => onRemovePlayer(player.id)}
                className="font-display rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
