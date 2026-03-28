export interface LibraryPlayer {
  id: string
  name: string
  tournamentCount: number
  createdAt: string
}

export interface PlayerStatsSummary {
  playerId: string
  name: string
  tournamentsPlayed: number
  gamesPlayed: number
  totalScore: number
  wins: number
  draws: number
  losses: number
  byes: number
  lastPlayedAt: string | null
}

export interface PlayerTournamentStat {
  tournamentId: string
  tournamentName: string
  updatedAt: string
  score: number
  gamesPlayed: number
  wins: number
  draws: number
  losses: number
  byes: number
}

export interface PlayerStatsDetail {
  summary: PlayerStatsSummary
  tournaments: PlayerTournamentStat[]
}
