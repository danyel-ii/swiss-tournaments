import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import type {
  OngoingPairingCandidate,
  OngoingTableDetail,
  OngoingTableSettings,
  OngoingTableSummary,
} from '../types/ongoingTable'
import type { ManualMatchResult } from '../types/tournament'

interface TableListResponse {
  tables: OngoingTableSummary[]
}

interface TableDetailResponse {
  table: OngoingTableDetail
}

interface PairingResponse {
  candidates: OngoingPairingCandidate[]
}

interface GameResponse {
  game: unknown
}

async function createGameRequest(
  tableId: string,
  candidate: OngoingPairingCandidate,
): Promise<void> {
  await apiRequest<GameResponse>(
    `/api/ongoing-tables?tableId=${encodeURIComponent(tableId)}&action=game`,
    {
      method: 'POST',
      body: JSON.stringify({
        whitePlayerId: candidate.whitePlayerId,
        blackPlayerId: candidate.blackPlayerId,
        pairingWeight: candidate.weight,
        pairingSnapshot: candidate,
      }),
    },
  )
}

async function createManualGameRequest(params: {
  tableId: string
  whitePlayerId: string
  blackPlayerId: string
}): Promise<void> {
  await apiRequest<GameResponse>(
    `/api/ongoing-tables?tableId=${encodeURIComponent(params.tableId)}&action=game`,
    {
      method: 'POST',
      body: JSON.stringify({
        whitePlayerId: params.whitePlayerId,
        blackPlayerId: params.blackPlayerId,
        pairingWeight: null,
        pairingSnapshot: { manual: true },
      }),
    },
  )
}

export function useOngoingTables(enabled: boolean) {
  const [tables, setTables] = useState<OngoingTableSummary[]>([])
  const [activeTable, setActiveTable] = useState<OngoingTableDetail | null>(null)
  const [pairingCandidates, setPairingCandidates] = useState<OngoingPairingCandidate[]>([])
  const [loading, setLoading] = useState(enabled)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTables = useCallback(async () => {
    if (!enabled) {
      setTables([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await apiRequest<TableListResponse>('/api/ongoing-tables')
      setTables(response.tables)
      setError(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load tables')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  const loadTable = useCallback(async (tableId: string) => {
    const response = await apiRequest<TableDetailResponse>(
      `/api/ongoing-tables?tableId=${encodeURIComponent(tableId)}`,
    )
    setActiveTable(response.table)
    setPairingCandidates([])
    setError(null)
    return response.table
  }, [])

  useEffect(() => {
    void loadTables()
  }, [loadTables])

  const mutate = async <T>(callback: () => Promise<T>): Promise<T> => {
    setMutating(true)
    try {
      const result = await callback()
      setError(null)
      return result
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update table')
      throw requestError
    } finally {
      setMutating(false)
    }
  }

  const createTable = async (
    name: string,
    playerIds: string[],
    settings?: Partial<OngoingTableSettings>,
  ) =>
    mutate(async () => {
      const response = await apiRequest<TableDetailResponse>('/api/ongoing-tables', {
        method: 'POST',
        body: JSON.stringify({ name, playerIds, settings }),
      })
      setActiveTable(response.table)
      await loadTables()
      return response.table
    })

  const updateTablePlayers = async (
    tableId: string,
    payload: {
      name?: string
      addPlayerIds?: string[]
      removePlayerIds?: string[]
      settings?: Partial<OngoingTableSettings>
    },
  ) =>
    mutate(async () => {
      const response = await apiRequest<TableDetailResponse>(
        `/api/ongoing-tables?tableId=${encodeURIComponent(tableId)}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        },
      )
      setActiveTable(response.table)
      await loadTables()
      return response.table
    })

  const suggestPairing = async (tableId: string, batch = false) =>
    mutate(async () => {
      const response = await apiRequest<PairingResponse>(
        `/api/ongoing-tables?tableId=${encodeURIComponent(tableId)}&action=suggest`,
        {
          method: 'POST',
          body: JSON.stringify({ batch }),
        },
      )
      setPairingCandidates(response.candidates)
      return response.candidates
    })

  const createGame = async (
    tableId: string,
    candidate: OngoingPairingCandidate,
  ) =>
    mutate(async () => {
      await createGameRequest(tableId, candidate)
      setPairingCandidates([])
      return loadTable(tableId)
    })

  const createGames = async (
    tableId: string,
    candidates: OngoingPairingCandidate[],
  ) =>
    mutate(async () => {
      for (const candidate of candidates) {
        await createGameRequest(tableId, candidate)
      }

      setPairingCandidates([])
      return loadTable(tableId)
    })

  const createManualGame = async (
    tableId: string,
    whitePlayerId: string,
    blackPlayerId: string,
  ) =>
    mutate(async () => {
      await createManualGameRequest({ tableId, whitePlayerId, blackPlayerId })
      setPairingCandidates([])
      return loadTable(tableId)
    })

  const setGameResult = async (
    tableId: string,
    gameId: string,
    result: ManualMatchResult,
  ) =>
    mutate(async () => {
      const response = await apiRequest<TableDetailResponse>(
        `/api/ongoing-tables?tableId=${encodeURIComponent(tableId)}&action=result`,
        {
          method: 'POST',
          body: JSON.stringify({ gameId, result }),
        },
      )
      setActiveTable(response.table)
      await loadTables()
      return response.table
    })

  const archiveTable = async (tableId: string) =>
    mutate(async () => {
      await apiRequest<{ ok: true }>(
        `/api/ongoing-tables?tableId=${encodeURIComponent(tableId)}&action=archive`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      )
      await loadTables()
    })

  const deleteTable = async (tableId: string) =>
    mutate(async () => {
      await apiRequest<{ ok: true }>(
        `/api/ongoing-tables?tableId=${encodeURIComponent(tableId)}`,
        {
          method: 'DELETE',
          body: JSON.stringify({}),
        },
      )
      if (activeTable?.id === tableId) {
        setActiveTable(null)
      }
      await loadTables()
    })

  return {
    tables,
    activeTable,
    pairingCandidates,
    loading,
    mutating,
    error,
    loadTables,
    loadTable,
    createTable,
    updateTablePlayers,
    suggestPairing,
    createGame,
    createGames,
    createManualGame,
    setGameResult,
    archiveTable,
    deleteTable,
  }
}
