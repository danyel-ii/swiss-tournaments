import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import type { AuthUser } from '../types/auth'

interface SessionResponse {
  user: AuthUser | null
}

interface LoginResponse {
  user: AuthUser
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const session = await apiRequest<SessionResponse>('/api/auth/session')

        if (!cancelled) {
          setUser(session.user)
          setError(null)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load session')
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
  }, [])

  const login = async (username: string, password: string) => {
    setError(null)
    const response = await apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    setUser(response.user)
  }

  const logout = async () => {
    await apiRequest<{ ok: true }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    setUser(null)
  }

  return {
    user,
    loading,
    error,
    setError,
    login,
    logout,
  }
}
