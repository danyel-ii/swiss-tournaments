import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import type { PlayerStatsDetail, PlayerStatsSummary } from '../types/library'

interface PlayerStatsResponse {
  players: PlayerStatsSummary[]
}

export function usePlayerStats(
  enabled: boolean,
  refreshKey: string,
  selectedPlayerId: string | null,
) {
  const [players, setPlayers] = useState<PlayerStatsSummary[]>([])
  const [detail, setDetail] = useState<PlayerStatsDetail | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setPlayers([])
      setDetail(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      try {
        const response = await apiRequest<PlayerStatsResponse>('/api/player-stats')
        if (!cancelled) {
          setPlayers(response.players)
          setError(null)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load player stats')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, refreshKey])

  useEffect(() => {
    const targetPlayerId = selectedPlayerId ?? players[0]?.playerId ?? null

    if (!enabled || !targetPlayerId) {
      setDetail(null)
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const nextDetail = await apiRequest<PlayerStatsDetail>(
          `/api/player-stats?playerId=${encodeURIComponent(targetPlayerId)}`,
        )
        if (!cancelled) {
          setDetail(nextDetail)
          setError(null)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load player detail')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, players, selectedPlayerId])

  const deletePlayer = async (playerId: string) => {
    setMutating(true)

    try {
      await apiRequest<{ ok: true }>(
        `/api/player-stats?playerId=${encodeURIComponent(playerId)}`,
        {
          method: 'DELETE',
        },
      )

      const nextPlayers = players.filter((player) => player.playerId !== playerId)
      setPlayers(nextPlayers)

      if (detail?.summary.playerId === playerId) {
        setDetail(null)
      }

      setError(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete player stats')
      throw requestError
    } finally {
      setMutating(false)
    }
  }

  const loadDetail = async (playerId: string) =>
    apiRequest<PlayerStatsDetail>(
      `/api/player-stats?playerId=${encodeURIComponent(playerId)}`,
    )

  return {
    players,
    detail,
    loading,
    mutating,
    error,
    deletePlayer,
    loadDetail,
  }
}
