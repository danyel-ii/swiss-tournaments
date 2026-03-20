import {
  getCurrentRoundMatches,
  hasTournamentStarted,
  isCurrentRoundComplete,
} from './ranking'
import { generatePairings } from './swissPairing'
import type { ManualMatchResult, Player, Tournament } from '../types/tournament'

function now(): string {
  return new Date().toISOString()
}

function withUpdatedTimestamp(tournament: Tournament): Tournament {
  return {
    ...tournament,
    updatedAt: now(),
  }
}

interface CreateTournamentOptions {
  id?: string
  name?: string
}

export function createDefaultTournament(options: CreateTournamentOptions = {}): Tournament {
  const timestamp = now()

  return {
    id: options.id ?? crypto.randomUUID(),
    name: options.name ?? 'Chess Tournament',
    totalRounds: 5,
    currentRound: 0,
    status: 'setup',
    players: [],
    matches: [],
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function addPlayer(tournament: Tournament, name: string): Tournament {
  if (hasTournamentStarted(tournament)) {
    return tournament
  }

  const trimmedName = name.trim()

  if (!trimmedName) {
    return tournament
  }

  const nextSeed =
    tournament.players.reduce((maxSeed, player) => Math.max(maxSeed, player.seed), 0) + 1
  const player: Player = {
    id: crypto.randomUUID(),
    name: trimmedName,
    seed: nextSeed,
  }

  return withUpdatedTimestamp({
    ...tournament,
    players: [...tournament.players, player],
  })
}

export function removePlayer(
  tournament: Tournament,
  playerId: string,
): Tournament {
  if (hasTournamentStarted(tournament)) {
    return tournament
  }

  return withUpdatedTimestamp({
    ...tournament,
    players: tournament.players.filter((player) => player.id !== playerId),
  })
}

export function setTournamentName(
  tournament: Tournament,
  name: string,
): Tournament {
  if (hasTournamentStarted(tournament)) {
    return tournament
  }

  return withUpdatedTimestamp({
    ...tournament,
    name: name.trim() || 'Chess Tournament',
  })
}

export function setTotalRounds(
  tournament: Tournament,
  totalRounds: number,
): Tournament {
  if (hasTournamentStarted(tournament)) {
    return tournament
  }

  if (!Number.isInteger(totalRounds) || totalRounds < 1 || totalRounds > 20) {
    return tournament
  }

  return withUpdatedTimestamp({
    ...tournament,
    totalRounds,
  })
}

export function startTournament(tournament: Tournament): Tournament {
  if (hasTournamentStarted(tournament) || tournament.players.length < 2) {
    return tournament
  }

  if (tournament.totalRounds < 1 || tournament.totalRounds > 20) {
    return tournament
  }

  return withUpdatedTimestamp({
    ...tournament,
    currentRound: 1,
    status: 'in_progress',
    matches: generatePairings(tournament),
  })
}

function syncTournamentStatus(tournament: Tournament): Tournament {
  if (
    tournament.status === 'in_progress' &&
    tournament.currentRound === tournament.totalRounds &&
    isCurrentRoundComplete(tournament.matches, tournament.currentRound)
  ) {
    return withUpdatedTimestamp({
      ...tournament,
      status: 'completed',
    })
  }

  return tournament
}

export function setMatchResult(
  tournament: Tournament,
  matchId: string,
  result: ManualMatchResult,
): Tournament {
  if (tournament.status !== 'in_progress') {
    return tournament
  }

  const currentRoundMatches = getCurrentRoundMatches(tournament)

  if (!currentRoundMatches.some((match) => match.id === matchId)) {
    return tournament
  }

  const nextTournament = withUpdatedTimestamp({
    ...tournament,
    matches: tournament.matches.map((match) => {
      if (match.id !== matchId || match.isBye) {
        return match
      }

      return {
        ...match,
        result,
      }
    }),
  })

  return syncTournamentStatus(nextTournament)
}

export function generateNextRound(tournament: Tournament): Tournament {
  if (tournament.status !== 'in_progress') {
    return tournament
  }

  if (!isCurrentRoundComplete(tournament.matches, tournament.currentRound)) {
    return tournament
  }

  if (tournament.currentRound >= tournament.totalRounds) {
    return syncTournamentStatus(tournament)
  }

  const nextRoundMatches = generatePairings(tournament)

  return withUpdatedTimestamp({
    ...tournament,
    currentRound: tournament.currentRound + 1,
    matches: [...tournament.matches, ...nextRoundMatches],
  })
}

export function resetTournament(tournament?: Tournament): Tournament {
  return createDefaultTournament({
    id: tournament?.id,
    name: tournament?.name,
  })
}
