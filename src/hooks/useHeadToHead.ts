import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import type { HeadToHeadDetail } from '../types/library'

export function useHeadToHead(
  enabled: boolean,
  refreshKey: string,
  leftPlayerId: string | null,
  rightPlayerId: string | null,
) {
  const [detail, setDetail] = useState<HeadToHeadDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !leftPlayerId || !rightPlayerId || leftPlayerId === rightPlayerId) {
      setDetail(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      try {
        const nextDetail = await apiRequest<HeadToHeadDetail>(
          `/api/head-to-head?leftPlayerId=${encodeURIComponent(leftPlayerId)}&rightPlayerId=${encodeURIComponent(rightPlayerId)}`,
        )

        if (!cancelled) {
          setDetail(nextDetail)
          setError(null)
        }
      } catch (requestError) {
        if (!cancelled) {
          setDetail(null)
          setError(requestError instanceof Error ? requestError.message : 'Unable to load head-to-head data')
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
  }, [enabled, refreshKey, leftPlayerId, rightPlayerId])

  return {
    detail,
    loading,
    error,
  }
}
