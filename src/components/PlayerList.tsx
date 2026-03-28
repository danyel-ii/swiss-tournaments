import { useState } from 'react'
import { AvatarBadge, PawnIcon, ShieldIcon } from './GamePieces'
import type { LibraryPlayer } from '../types/library'
import type { Player, TournamentStatus } from '../types/tournament'
import { useI18n } from '../useI18n'

interface PlayerListProps {
  players: Player[]
  status: TournamentStatus
  currentRound: number
  libraryPlayers: LibraryPlayer[]
  libraryLoading: boolean
  libraryDeleting: boolean
  libraryError: string | null
  playerName: string
  error: string | null
  duplicateWarning: string | null
  onPlayerNameChange: (value: string) => void
  onAddPlayer: () => void
  onAddLibraryPlayer: (player: LibraryPlayer) => void
  onDeleteLibraryPlayer: (player: LibraryPlayer) => Promise<void>
  onRenamePlayer: (playerId: string, name: string) => void
  onRemovePlayer: (playerId: string) => void
}

export function PlayerList({
  players,
  status,
  currentRound,
  libraryPlayers,
  libraryLoading,
  libraryDeleting,
  libraryError,
  playerName,
  error,
  duplicateWarning,
  onPlayerNameChange,
  onAddPlayer,
  onAddLibraryPlayer,
  onDeleteLibraryPlayer,
  onRenamePlayer,
  onRemovePlayer,
}: PlayerListProps) {
  const { t } = useI18n()
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const canAddPlayers = status !== 'completed'

  const startEditing = (player: Player) => {
    setEditingPlayerId(player.id)
    setEditingName(player.name)
  }

  const stopEditing = () => {
    setEditingPlayerId(null)
    setEditingName('')
  }

  const handleDeleteLibraryPlayer = async (libraryPlayer: LibraryPlayer) => {
    const confirmed = window.confirm(t.players.deleteLibraryConfirm(libraryPlayer.name))

    if (!confirmed) {
      return
    }

    await onDeleteLibraryPlayer(libraryPlayer)
  }

  return (
    <section className="theme-panel rounded-3xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="theme-heading font-display text-2xl font-semibold">{t.players.title}</h2>
          <p className="theme-copy font-data mt-1 text-sm">
            {t.players.subtitle(status)}
          </p>
        </div>
      </div>

      {canAddPlayers ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
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

          <div className="theme-muted-panel rounded-3xl px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="theme-heading font-display text-lg font-semibold">
                  {t.players.libraryTitle}
                </h3>
                <p className="theme-copy font-data text-sm">{t.players.addFromLibrary}</p>
              </div>
              <span className="theme-copy font-data text-sm">
                {libraryLoading || libraryDeleting ? '…' : libraryPlayers.length}
              </span>
            </div>

            {libraryPlayers.length === 0 ? (
              <p className="theme-copy font-data mt-3 text-sm">
                {t.players.libraryEmpty}
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                {libraryPlayers
                  .filter(
                    (libraryPlayer) =>
                      !players.some((player) => player.libraryPlayerId === libraryPlayer.id),
                  )
                  .map((libraryPlayer) => (
                    <div
                      key={libraryPlayer.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--theme-surface)] px-4 py-3"
                    >
                      <button
                        type="button"
                        onClick={() => onAddLibraryPlayer(libraryPlayer)}
                        className="min-w-0 flex-1 truncate text-left font-display text-sm font-semibold transition hover:text-[var(--theme-plum)]"
                      >
                        {libraryPlayer.name}
                      </button>

                      <button
                        type="button"
                        disabled={libraryDeleting}
                        onClick={() => {
                          void handleDeleteLibraryPlayer(libraryPlayer)
                        }}
                        className="font-display rounded-full bg-[var(--theme-red-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--theme-red)] transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {t.players.deleteLibrary}
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {libraryError ? (
              <p className="font-data mt-3 text-sm text-[var(--theme-red)]">{libraryError}</p>
            ) : null}
          </div>
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
          {players.map((player) => {
            const isEditing = editingPlayerId === player.id
            const isPendingEntry = status !== 'setup' && player.enteredRound > currentRound
            const isDropped = player.droppedAfterRound !== null
            const canRemove = status !== 'completed' && !isDropped
            const removeLabel =
              status === 'setup' || isPendingEntry ? t.players.remove : t.players.dropNextRound
            let statusText = t.players.active

            if (isPendingEntry) {
              statusText = t.players.joinsNextRound(player.enteredRound)
            } else if (player.droppedAfterRound !== null) {
              statusText = t.players.droppedAfterRound(player.droppedAfterRound)
            }

            return (
              <article
                key={player.id}
                className="theme-muted-panel flex flex-col gap-4 rounded-3xl px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex items-start gap-3">
                    <AvatarBadge seed={player.seed} />
                    <div className="min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              onRenamePlayer(player.id, editingName)
                              stopEditing()
                            }

                            if (event.key === 'Escape') {
                              event.preventDefault()
                              stopEditing()
                            }
                          }}
                          className="theme-input font-data w-full rounded-2xl border px-4 py-2 outline-none transition"
                        />
                      ) : (
                        <p className="theme-heading truncate font-display text-lg font-semibold">
                          {player.name}
                        </p>
                      )}
                      <p className="theme-copy font-data mt-1 inline-flex max-w-full items-center gap-2 text-sm">
                        <PawnIcon className="h-4 w-4" />
                        {t.players.seed(player.seed)}
                      </p>
                      <p className="theme-copy font-data mt-1 text-sm">
                        {statusText}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onRenamePlayer(player.id, editingName)
                            stopEditing()
                          }}
                          className="theme-button-aqua font-display rounded-full px-4 py-2 text-sm font-semibold transition"
                        >
                          {t.players.save}
                        </button>
                        <button
                          type="button"
                          onClick={stopEditing}
                          className="font-display rounded-full bg-[var(--theme-surface)] px-4 py-2 text-sm font-semibold transition"
                        >
                          {t.players.cancel}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditing(player)}
                        className="font-display rounded-full bg-[var(--theme-surface)] px-4 py-2 text-sm font-semibold transition"
                      >
                        {t.players.edit}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={!canRemove}
                      onClick={() => onRemovePlayer(player.id)}
                      className="font-display rounded-full bg-[var(--theme-surface)] px-4 py-2 text-sm font-semibold text-[var(--theme-red)] transition hover:bg-[var(--theme-red-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {removeLabel}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
