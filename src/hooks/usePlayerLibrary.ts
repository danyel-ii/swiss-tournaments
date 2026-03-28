import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import type { LibraryPlayer } from '../types/library'

interface PlayerLibraryResponse {
  players: LibraryPlayer[]
}

export function usePlayerLibrary(enabled: boolean, refreshKey: string) {
  const [players, setPlayers] = useState<LibraryPlayer[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setPlayers([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      try {
        const response = await apiRequest<PlayerLibraryResponse>('/api/player-library')
        if (!cancelled) {
          setPlayers(response.players)
          setError(null)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load player library')
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

  return {
    players,
    loading,
    error,
  }
}
