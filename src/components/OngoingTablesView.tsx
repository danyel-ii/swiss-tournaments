import { useMemo, useState } from 'react'
import { useI18n } from '../useI18n'
import type { LibraryPlayer } from '../types/library'
import type { ManualMatchResult } from '../types/tournament'
import type { useOngoingTables } from '../hooks/useOngoingTables'
import { formatScore } from '../utils/format'

type OngoingTablesState = ReturnType<typeof useOngoingTables>

interface OngoingTablesViewProps {
  libraryPlayers: LibraryPlayer[]
  tablesState: OngoingTablesState
  onRatingsChanged: () => void
}

const RESULTS: ManualMatchResult[] = ['1-0', '0-1', '0.5-0.5', '0-0']

export function OngoingTablesView({
  libraryPlayers,
  tablesState,
  onRatingsChanged,
}: OngoingTablesViewProps) {
  const { t } = useI18n()
  const [tableName, setTableName] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const activePlayers = tablesState.activeTable?.players.filter((player) => player.active) ?? []
  const pendingGames = tablesState.activeTable?.games.filter((game) => game.result === null) ?? []
  const recentGames = tablesState.activeTable?.games.filter((game) => game.result !== null).slice(0, 8) ?? []
  const canCreate = tableName.trim().length > 0 && selectedPlayerIds.length >= 2 && !tablesState.mutating
  const availableLibraryPlayers = useMemo(
    () =>
      libraryPlayers
        .filter((player) => !tablesState.activeTable?.players.some((entry) => entry.playerId === player.id))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [libraryPlayers, tablesState.activeTable?.players],
  )

  const toggleSelectedPlayer = (playerId: string) => {
    setSelectedPlayerIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    )
  }

  const createTable = async () => {
    if (!canCreate) {
      return
    }

    await tablesState.createTable(tableName, selectedPlayerIds)
    setTableName('')
    setSelectedPlayerIds([])
  }

  const saveResult = async (gameId: string, result: ManualMatchResult) => {
    if (!tablesState.activeTable) {
      return
    }

    await tablesState.setGameResult(tablesState.activeTable.id, gameId, result)
    onRatingsChanged()
  }

  return (
    <section className="theme-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-4 border-b border-[rgba(54,6,77,0.12)] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--theme-text-soft)]">
            {t.navigation.tables}
          </p>
          <h2 className="theme-heading mt-2 font-display text-4xl font-bold md:text-5xl">
            {t.tables.title}
          </h2>
          <p className="theme-copy mt-2 font-data text-base">{t.tables.subtitle}</p>
        </div>
      </div>

      {tablesState.error ? (
        <div className="mt-6 rounded-3xl bg-[var(--theme-red-soft)] px-4 py-4 text-sm text-[var(--theme-red)]">
          {tablesState.error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4">
          <div className="theme-muted-panel rounded-3xl px-4 py-4">
            <h3 className="theme-heading font-display text-xl font-semibold">
              {t.tables.createTable}
            </h3>
            <label className="theme-label mt-4 block text-sm font-medium">
              <span className="font-display">{t.tables.tableName}</span>
              <input
                value={tableName}
                onChange={(event) => setTableName(event.target.value)}
                className="theme-input font-data mt-2 w-full rounded-2xl border px-4 py-3 outline-none"
              />
            </label>
            <div className="mt-4 space-y-2">
              <p className="font-display text-sm font-semibold">{t.tables.selectPlayers}</p>
              {libraryPlayers.map((player) => (
                <label
                  key={player.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--theme-surface)] px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="theme-heading block truncate font-display text-sm font-semibold">
                      {player.name}
                    </span>
                    <span className="theme-copy font-data text-xs">
                      {t.tables.internalElo}: {player.internalRating}
                      {player.ratingProvisional ? ` (${t.tables.provisional})` : ''}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedPlayerIds.includes(player.id)}
                    onChange={() => toggleSelectedPlayer(player.id)}
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={!canCreate}
              onClick={() => {
                void createTable()
              }}
              className="theme-button-aqua mt-4 rounded-2xl px-5 py-3 font-display text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.tables.createTable}
            </button>
          </div>

          <div className="theme-muted-panel rounded-3xl px-4 py-4">
            <h3 className="theme-heading font-display text-xl font-semibold">
              {t.tables.activeTables}
            </h3>
            <div className="mt-3 space-y-2">
              {tablesState.tables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => {
                    void tablesState.loadTable(table.id)
                  }}
                  className={`w-full rounded-2xl px-4 py-3 text-left ${
                    tablesState.activeTable?.id === table.id
                      ? 'bg-[var(--theme-aqua-soft)]'
                      : 'bg-[var(--theme-surface)]'
                  }`}
                >
                  <span className="theme-heading block truncate font-display text-sm font-semibold">
                    {table.name}
                  </span>
                  <span className="theme-copy font-data text-xs">
                    {table.playerCount} · {table.completedGames}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {tablesState.activeTable ? (
          <div className="space-y-6">
            <div className="theme-muted-panel rounded-3xl px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="theme-heading font-display text-2xl font-semibold">
                    {tablesState.activeTable.name}
                  </h3>
                  <p className="theme-copy font-data text-sm">{tablesState.activeTable.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={tablesState.mutating || activePlayers.length < 2}
                    onClick={() => {
                      void tablesState.suggestPairing(tablesState.activeTable?.id ?? '', false)
                    }}
                    className="rounded-full bg-[var(--theme-aqua-soft)] px-4 py-2 font-display text-sm font-semibold"
                  >
                    {t.tables.suggestPairing}
                  </button>
                  <button
                    type="button"
                    disabled={tablesState.mutating || activePlayers.length < 2}
                    onClick={() => {
                      void tablesState.suggestPairing(tablesState.activeTable?.id ?? '', true)
                    }}
                    className="rounded-full bg-[var(--theme-surface)] px-4 py-2 font-display text-sm font-semibold"
                  >
                    {t.tables.suggestBatch}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void tablesState.archiveTable(tablesState.activeTable?.id ?? '')
                    }}
                    className="rounded-full bg-[var(--theme-surface)] px-4 py-2 font-display text-sm font-semibold"
                  >
                    {t.tables.archiveTable}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t.tables.deleteTable)) {
                        void tablesState.deleteTable(tablesState.activeTable?.id ?? '').then(onRatingsChanged)
                      }
                    }}
                    className="rounded-full bg-[var(--theme-red-soft)] px-4 py-2 font-display text-sm font-semibold text-[var(--theme-red)]"
                  >
                    {t.tables.deleteTable}
                  </button>
                </div>
              </div>
            </div>

            {tablesState.pairingCandidates.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {tablesState.pairingCandidates.map((candidate) => (
                  <article
                    key={`${candidate.whitePlayerId}:${candidate.blackPlayerId}`}
                    className="theme-muted-panel rounded-3xl px-4 py-4"
                  >
                    <p className="theme-heading font-display text-lg font-semibold">
                      {candidate.whiteName} - {candidate.blackName}
                    </p>
                    <p className="theme-copy mt-1 font-data text-sm">
                      {(candidate.probability * 100).toFixed(1)}% · Δ {candidate.eloDifference} · H2H {candidate.gamesBetween}
                    </p>
                    <button
                      type="button"
                      disabled={tablesState.mutating}
                      onClick={() => {
                        void tablesState.createGame(tablesState.activeTable?.id ?? '', candidate)
                      }}
                      className="theme-button-aqua mt-3 rounded-full px-4 py-2 font-display text-sm font-semibold"
                    >
                      {t.tables.createGame}
                    </button>
                  </article>
                ))}
              </div>
            ) : null}

            <div className="theme-muted-panel rounded-3xl px-4 py-4">
              <h3 className="theme-heading font-display text-xl font-semibold">{t.tables.standings}</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left font-data text-sm">
                  <thead className="text-[var(--theme-text-soft)]">
                    <tr>
                      <th className="py-2">#</th>
                      <th>{t.standings.player}</th>
                      <th>{t.tables.rating}</th>
                      <th>{t.standings.score}</th>
                      <th>W/D/L</th>
                      <th>{t.statistics.gamesPlayed}</th>
                      <th>{t.statistics.whiteBlack}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablesState.activeTable.players.map((player, index) => (
                      <tr key={player.playerId} className="border-t border-[var(--theme-border)]">
                        <td className="py-2">{index + 1}</td>
                        <td>{player.name}</td>
                        <td>{player.rating}{player.provisional ? '*' : ''}</td>
                        <td>{formatScore(player.tableScore)}</td>
                        <td>{player.wins}/{player.draws}/{player.losses}</td>
                        <td>{player.tableGames}</td>
                        <td>{player.whiteGames}/{player.blackGames}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {availableLibraryPlayers.length > 0 ? (
              <div className="theme-muted-panel rounded-3xl px-4 py-4">
                <h3 className="theme-heading font-display text-xl font-semibold">
                  {t.players.addFromLibrary}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableLibraryPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => {
                        void tablesState.updateTablePlayers(tablesState.activeTable?.id ?? '', {
                          addPlayerIds: [player.id],
                        })
                      }}
                      className="rounded-full bg-[var(--theme-surface)] px-4 py-2 font-display text-sm font-semibold"
                    >
                      {player.name} · {player.internalRating}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="theme-muted-panel rounded-3xl px-4 py-4">
                <h3 className="theme-heading font-display text-xl font-semibold">{t.tables.pendingGames}</h3>
                <div className="mt-3 space-y-3">
                  {pendingGames.map((game) => (
                    <article key={game.id} className="rounded-2xl bg-[var(--theme-surface)] px-4 py-3">
                      <p className="theme-heading font-display text-sm font-semibold">
                        {game.whiteName} - {game.blackName}
                      </p>
                      <select
                        value=""
                        onChange={(event) => {
                          void saveResult(game.id, event.target.value as ManualMatchResult)
                        }}
                        className="theme-input mt-2 rounded-full border px-3 py-2 font-data text-sm"
                      >
                        <option value="">{t.common.selectResult}</option>
                        {RESULTS.map((result) => (
                          <option key={result} value={result}>{result}</option>
                        ))}
                      </select>
                    </article>
                  ))}
                  {pendingGames.length === 0 ? (
                    <p className="theme-copy font-data text-sm">{t.common.pending}: 0</p>
                  ) : null}
                </div>
              </div>

              <div className="theme-muted-panel rounded-3xl px-4 py-4">
                <h3 className="theme-heading font-display text-xl font-semibold">{t.tables.recentGames}</h3>
                <div className="mt-3 space-y-3">
                  {recentGames.map((game) => (
                    <article key={game.id} className="rounded-2xl bg-[var(--theme-surface)] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="theme-heading min-w-0 truncate font-display text-sm font-semibold">
                          {game.whiteName} - {game.blackName}
                        </p>
                        <select
                          value={game.result ?? ''}
                          onChange={(event) => {
                            void saveResult(game.id, event.target.value as ManualMatchResult)
                          }}
                          className="theme-input shrink-0 rounded-full border px-3 py-2 font-data text-sm"
                        >
                          {RESULTS.map((result) => (
                            <option key={result} value={result}>{result}</option>
                          ))}
                        </select>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="theme-muted-panel rounded-3xl px-5 py-10 text-center font-data text-sm">
            {t.tables.noTableSelected}
          </div>
        )}
      </div>
    </section>
  )
}
