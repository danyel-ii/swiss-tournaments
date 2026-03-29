import {
  getCurrentRoundMatches,
  getPlayersEligibleForRound,
  hasTournamentStarted,
  isCurrentRoundComplete,
} from './ranking'
import { generatePairings } from './swissPairing'
import type { ManualMatchResult, PairingAlgorithm, Player, Tournament } from '../types/tournament'

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
    pairingAlgorithm: 'blossom',
    currentRound: 0,
    status: 'setup',
    players: [],
    matches: [],
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function addPlayer(
  tournament: Tournament,
  name: string,
  libraryPlayerId: string | null = null,
): Tournament {
  if (tournament.status === 'completed') {
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
    libraryPlayerId,
    name: trimmedName,
    seed: nextSeed,
    enteredRound: tournament.status === 'setup' ? 1 : tournament.currentRound + 1,
    droppedAfterRound: null,
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
  if (tournament.status === 'completed') {
    return tournament
  }

  if (!hasTournamentStarted(tournament)) {
    return withUpdatedTimestamp({
      ...tournament,
      players: tournament.players.filter((player) => player.id !== playerId),
    })
  }

  const player = tournament.players.find((entry) => entry.id === playerId)

  if (!player) {
    return tournament
  }

  if (player.enteredRound > tournament.currentRound) {
    return withUpdatedTimestamp({
      ...tournament,
      players: tournament.players.filter((entry) => entry.id !== playerId),
    })
  }

  if (player.droppedAfterRound !== null) {
    return tournament
  }

  return withUpdatedTimestamp({
    ...tournament,
    players: tournament.players.map((entry) =>
      entry.id === playerId
        ? {
            ...entry,
            droppedAfterRound: tournament.currentRound,
          }
        : entry,
    ),
  })
}

export function renamePlayer(
  tournament: Tournament,
  playerId: string,
  name: string,
): Tournament {
  const trimmedName = name.trim()

  if (!trimmedName) {
    return tournament
  }

  if (!tournament.players.some((player) => player.id === playerId)) {
    return tournament
  }

  return withUpdatedTimestamp({
    ...tournament,
    players: tournament.players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            name: trimmedName,
          }
        : player,
    ),
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

export function setPairingAlgorithm(
  tournament: Tournament,
  pairingAlgorithm: PairingAlgorithm,
): Tournament {
  if (hasTournamentStarted(tournament)) {
    return tournament
  }

  if (pairingAlgorithm !== 'greedy' && pairingAlgorithm !== 'blossom') {
    return tournament
  }

  return withUpdatedTimestamp({
    ...tournament,
    pairingAlgorithm,
  })
}

export function startTournament(tournament: Tournament): Tournament {
  const roundOnePlayers = getPlayersEligibleForRound(tournament.players, 1)

  if (hasTournamentStarted(tournament) || roundOnePlayers.length < 2) {
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
  if (
    tournament.status !== 'in_progress' &&
    tournament.status !== 'completed'
  ) {
    return tournament
  }

  const targetMatch = tournament.matches.find((match) => match.id === matchId)

  if (!targetMatch || targetMatch.isBye) {
    return tournament
  }

  if (targetMatch.round > tournament.currentRound) {
    return tournament
  }

  if (targetMatch.round === tournament.currentRound) {
    const currentRoundMatches = getCurrentRoundMatches(tournament)

    if (!currentRoundMatches.some((match) => match.id === matchId)) {
      return tournament
    }

    const nextTournament = withUpdatedTimestamp({
      ...tournament,
      matches: tournament.matches.map((match) => {
        if (match.id !== matchId) {
          return match
        }

        return {
          ...match,
          result,
        }
      }),
      status: 'in_progress',
    })

    return syncTournamentStatus(nextTournament)
  }

  const rewoundTournament = withUpdatedTimestamp({
    ...tournament,
    currentRound: targetMatch.round,
    status: 'in_progress',
    matches: tournament.matches
      .filter((match) => match.round <= targetMatch.round)
      .map((match) =>
        match.id === matchId
          ? {
              ...match,
              result,
            }
          : match,
      ),
  })

  return syncTournamentStatus(rewoundTournament)
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
