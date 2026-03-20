import { createDefaultTournament } from '../core/tournament'
import type { Tournament } from '../types/tournament'

const LEGACY_STORAGE_KEY = 'chessTournamentState'
const TOURNAMENT_INDEX_KEY = 'chessTournamentIndex'
const TOURNAMENT_STORAGE_PREFIX = 'chessTournamentState:'

interface TournamentIndex {
  version: 1
  activeTournamentId: string | null
  tournamentIds: string[]
}

export interface TournamentCollection {
  activeTournamentId: string
  tournaments: Tournament[]
}

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

function isTournamentIndex(value: unknown): value is TournamentIndex {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    candidate.version === 1 &&
    (typeof candidate.activeTournamentId === 'string' || candidate.activeTournamentId === null) &&
    Array.isArray(candidate.tournamentIds) &&
    candidate.tournamentIds.every((id) => typeof id === 'string')
  )
}

function getTournamentStorageKey(tournamentId: string) {
  return `${TOURNAMENT_STORAGE_PREFIX}${tournamentId}`
}

function createFallbackCollection(): TournamentCollection {
  const tournament = createDefaultTournament()

  return {
    activeTournamentId: tournament.id,
    tournaments: [tournament],
  }
}

function loadTournamentById(tournamentId: string): Tournament | null {
  const raw = window.localStorage.getItem(getTournamentStorageKey(tournamentId))

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    return isTournament(parsed) ? parsed : null
  } catch {
    return null
  }
}

function loadLegacyTournament(): Tournament | null {
  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    return isTournament(parsed) ? parsed : null
  } catch {
    return null
  }
}

function buildCollection(tournaments: Tournament[], activeTournamentId?: string | null): TournamentCollection {
  const safeTournaments = tournaments.length > 0 ? tournaments : [createDefaultTournament()]
  const safeActiveTournamentId = safeTournaments.some((tournament) => tournament.id === activeTournamentId)
    ? (activeTournamentId as string)
    : safeTournaments[0].id

  return {
    activeTournamentId: safeActiveTournamentId,
    tournaments: safeTournaments,
  }
}

export function loadTournamentCollection(): TournamentCollection {
  if (typeof window === 'undefined') {
    return createFallbackCollection()
  }

  const indexRaw = window.localStorage.getItem(TOURNAMENT_INDEX_KEY)

  if (!indexRaw) {
    const legacyTournament = loadLegacyTournament()

    if (legacyTournament) {
      return buildCollection([legacyTournament], legacyTournament.id)
    }

    return createFallbackCollection()
  }

  try {
    const parsed = JSON.parse(indexRaw)

    if (!isTournamentIndex(parsed)) {
      return createFallbackCollection()
    }

    const tournaments = parsed.tournamentIds
      .map((tournamentId) => loadTournamentById(tournamentId))
      .filter((tournament): tournament is Tournament => tournament !== null)

    if (tournaments.length === 0) {
      const legacyTournament = loadLegacyTournament()

      if (legacyTournament) {
        return buildCollection([legacyTournament], legacyTournament.id)
      }

      return createFallbackCollection()
    }

    return buildCollection(tournaments, parsed.activeTournamentId)
  } catch {
    return createFallbackCollection()
  }
}

export function saveTournamentCollection(collection: TournamentCollection): void {
  if (typeof window === 'undefined') {
    return
  }

  const previousIds = (() => {
    const raw = window.localStorage.getItem(TOURNAMENT_INDEX_KEY)

    if (!raw) {
      return []
    }

    try {
      const parsed = JSON.parse(raw)
      return isTournamentIndex(parsed) ? parsed.tournamentIds : []
    } catch {
      return []
    }
  })()

  const nextIds = collection.tournaments.map((tournament) => tournament.id)

  collection.tournaments.forEach((tournament) => {
    window.localStorage.setItem(getTournamentStorageKey(tournament.id), JSON.stringify(tournament))
  })

  previousIds
    .filter((tournamentId) => !nextIds.includes(tournamentId))
    .forEach((tournamentId) => {
      window.localStorage.removeItem(getTournamentStorageKey(tournamentId))
    })

  window.localStorage.setItem(
    TOURNAMENT_INDEX_KEY,
    JSON.stringify({
      version: 1,
      activeTournamentId: collection.activeTournamentId,
      tournamentIds: nextIds,
    } satisfies TournamentIndex),
  )

  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}
