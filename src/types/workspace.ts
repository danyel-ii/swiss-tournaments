import type { Tournament } from './tournament.js'

export interface TournamentCollection {
  activeTournamentId: string
  tournaments: Tournament[]
}
