import type { TournamentCollection } from '../src/types/workspace.js'

function now(): string {
  return new Date().toISOString()
}

function createDefaultTournament() {
  const timestamp = now()

  return {
    id: crypto.randomUUID(),
    name: 'Chess Tournament',
    totalRounds: 5,
    currentRound: 0,
    status: 'setup' as const,
    players: [],
    matches: [],
    version: 1 as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createDefaultTournamentCollection(): TournamentCollection {
  const tournament = createDefaultTournament()

  return {
    activeTournamentId: tournament.id,
    tournaments: [tournament],
  }
}
