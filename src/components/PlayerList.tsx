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
    <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_18px_60px_rgba(2,6,23,0.3)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-bold text-white">Player management</h2>
          <p className="mt-1 text-sm text-slate-300">
            Add at least 2 players to start a tournament.
          </p>
        </div>
      </div>

      {inSetup ? (
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <label className="flex-1 text-sm font-medium text-slate-200">
            Player name
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
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25"
            />
          </label>

          <button
            type="button"
            onClick={onAddPlayer}
            className="rounded-2xl bg-fuchsia-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-300 md:self-end"
          >
            Add Player
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {duplicateWarning ? (
        <p className="mt-2 text-sm text-amber-200">{duplicateWarning}</p>
      ) : null}

      {players.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-400">
          No players registered yet.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-slate-950/35 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Seed</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08] bg-transparent">
              {players.map((player) => (
                <tr key={player.id}>
                  <td className="px-4 py-3 text-slate-300">{player.seed}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {player.name}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={!inSetup}
                      onClick={() => onRemovePlayer(player.id)}
                      className="text-sm font-medium text-rose-300 transition hover:text-rose-200 disabled:cursor-not-allowed disabled:text-slate-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
