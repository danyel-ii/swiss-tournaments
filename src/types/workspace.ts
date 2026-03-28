import type { Tournament } from './tournament'

export interface TournamentCollection {
  activeTournamentId: string
  tournaments: Tournament[]
}
