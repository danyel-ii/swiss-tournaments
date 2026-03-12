import { createDefaultTournament } from '../core/tournament'
import type { Tournament } from '../types/tournament'

export const STORAGE_KEY = 'chessTournamentState'

function isTournament(value: unknown): value is Tournament {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.totalRounds === 'number' &&
    typeof candidate.currentRound === 'number' &&
    typeof candidate.status === 'string' &&
    Array.isArray(candidate.players) &&
    Array.isArray(candidate.matches) &&
    candidate.version === 1 &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

export function loadTournament(): Tournament {
  if (typeof window === 'undefined') {
    return createDefaultTournament()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return createDefaultTournament()
  }

  try {
    const parsed = JSON.parse(raw)

    if (isTournament(parsed)) {
      return parsed
    }
  } catch {
    return createDefaultTournament()
  }

  return createDefaultTournament()
}

export function saveTournament(tournament: Tournament): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament))
}

export function clearTournament(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
