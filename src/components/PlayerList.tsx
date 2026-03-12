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
    <section className="rounded-[32px] border border-[#2f6f66]/18 bg-[linear-gradient(180deg,_#f6edd0_0%,_#ebddb1_100%)] p-6 shadow-[inset_0_2px_0_rgba(255,255,255,0.7),0_18px_32px_rgba(21,58,54,0.14)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#27535d]">Pawn Registry</h2>
          <p className="font-data mt-1 text-sm text-[#567168]">
            Add at least 2 players to start a tournament.
          </p>
        </div>
      </div>

      {inSetup ? (
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <label className="flex-1 text-sm font-medium text-[#315d55]">
            <span className="font-display">New contender</span>
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
              className="font-data mt-2 w-full rounded-[22px] border-2 border-[#d8b15d] bg-[#fff7df] px-4 py-3 text-[#284b4f] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </label>

          <button
            type="button"
            onClick={onAddPlayer}
            className="font-display inline-flex items-center gap-2 rounded-[22px] border border-teal-800/18 bg-[linear-gradient(180deg,_#85dbc9_0%,_#4fae98_100%)] px-5 py-3 text-sm font-bold text-[#154d44] shadow-[inset_0_2px_0_rgba(255,255,255,0.55),0_8px_18px_rgba(44,118,98,0.18)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-teal-200 md:self-end"
          >
            <ShieldIcon className="h-4 w-4" />
            Add Player
          </button>
        </div>
      ) : null}

      {error ? <p className="font-data mt-3 text-sm text-rose-700">{error}</p> : null}
      {duplicateWarning ? (
        <p className="font-data mt-2 text-sm text-amber-800">{duplicateWarning}</p>
      ) : null}

      {players.length === 0 ? (
        <div className="font-data mt-6 rounded-2xl border border-dashed border-[#9ea781] bg-[#fff9e8] px-4 py-8 text-center text-sm text-[#5c6558]">
          No players registered yet.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {players.map((player) => (
            <article
              key={player.id}
              className="flex items-center justify-between gap-4 rounded-[24px] border border-[#aab394] bg-[#fffaf0] px-4 py-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.75),0_8px_16px_rgba(96,92,55,0.08)]"
            >
              <div className="flex items-center gap-3">
                <AvatarBadge seed={player.seed} />
                <div>
                  <p className="font-display text-lg font-bold text-[#295661]">
                    {player.name}
                  </p>
                  <p className="font-data inline-flex items-center gap-2 text-sm text-[#627168]">
                    <PawnIcon className="h-4 w-4" />
                    Seed {player.seed}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={!inSetup}
                onClick={() => onRemovePlayer(player.id)}
                className="font-display rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
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
