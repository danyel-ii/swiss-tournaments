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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-slate-900">Player management</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add at least 2 players to start a tournament.
          </p>
        </div>
      </div>

      {inSetup ? (
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <label className="flex-1 text-sm font-medium text-slate-700">
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
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            />
          </label>

          <button
            type="button"
            onClick={onAddPlayer}
            className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 md:self-end"
          >
            Add Player
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      {duplicateWarning ? (
        <p className="mt-2 text-sm text-amber-700">{duplicateWarning}</p>
      ) : null}

      {players.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          No players registered yet.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Seed</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {players.map((player) => (
                <tr key={player.id}>
                  <td className="px-4 py-3 text-slate-700">{player.seed}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {player.name}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={!inSetup}
                      onClick={() => onRemovePlayer(player.id)}
                      className="text-sm font-medium text-rose-700 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:text-slate-300"
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
