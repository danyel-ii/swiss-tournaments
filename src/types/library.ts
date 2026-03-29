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
  completedTournaments: number
  partialTournaments: number
  gamesPlayed: number
  totalScore: number
  scorePercentage: number
  wins: number
  winRate: number
  winRateAsWhite: number
  winRateAsBlack: number
  draws: number
  drawRate: number
  losses: number
  lossRate: number
  byes: number
  undefeatedTournaments: number
  lateEntries: number
  dropouts: number
  whiteGames: number
  blackGames: number
  colorImbalance: number
  longestWhiteStreak: number
  longestBlackStreak: number
  averageBuchholz: number
  bestBuchholz: number
  latestBuchholz: number | null
  lastPlayedAt: string | null
}

export interface PlayerTournamentOpponentStat {
  round: number
  board: number
  opponentPlayerId: string | null
  opponentName: string
  color: 'W' | 'B' | null
  result: string | null
  points: number
}

export interface PlayerTournamentRoundStat {
  round: number
  score: number
  buchholz: number
  rank: number
}

export interface PlayerTournamentStat {
  tournamentId: string
  tournamentName: string
  updatedAt: string
  status: 'setup' | 'in_progress' | 'completed'
  totalRounds: number
  currentRound: number
  playerCount: number
  seed: number
  finalRank: number
  placementDelta: number
  score: number
  scorePercentage: number
  buchholz: number
  gamesPlayed: number
  wins: number
  draws: number
  losses: number
  byes: number
  whiteGames: number
  blackGames: number
  colorImbalance: number
  longestWhiteStreak: number
  longestBlackStreak: number
  enteredRound: number
  droppedAfterRound: number | null
  lateEntry: boolean
  dropped: boolean
  undefeated: boolean
  opponents: PlayerTournamentOpponentStat[]
  rounds: PlayerTournamentRoundStat[]
}

export interface PlayerHeadToHeadStat {
  opponentPlayerId: string | null
  opponentName: string
  tournamentsPlayed: number
  gamesPlayed: number
  wins: number
  draws: number
  losses: number
  score: number
  whiteGames: number
  blackGames: number
  lastPlayedAt: string | null
}

export interface PlayerByeHistoryItem {
  tournamentId: string
  tournamentName: string
  updatedAt: string
  round: number
}

export interface PlayerStatsDetail {
  summary: PlayerStatsSummary
  tournaments: PlayerTournamentStat[]
  headToHead: PlayerHeadToHeadStat[]
  byeHistory: PlayerByeHistoryItem[]
}

export interface HeadToHeadMatch {
  tournamentId: string
  tournamentName: string
  updatedAt: string
  round: number
  board: number
  result: string | null
  leftColor: 'W' | 'B'
  rightColor: 'W' | 'B'
  leftPoints: number
  rightPoints: number
}

export interface HeadToHeadTournament {
  tournamentId: string
  tournamentName: string
  updatedAt: string
  status: 'setup' | 'in_progress' | 'completed'
  leftScore: number
  rightScore: number
  gamesPlayed: number
  matches: HeadToHeadMatch[]
}

export interface HeadToHeadDetail {
  leftPlayerId: string
  leftPlayerName: string
  rightPlayerId: string
  rightPlayerName: string
  gamesPlayed: number
  leftScore: number
  rightScore: number
  leftWins: number
  rightWins: number
  draws: number
  leftWhiteGames: number
  leftBlackGames: number
  rightWhiteGames: number
  rightBlackGames: number
  lastPlayedAt: string | null
  tournaments: HeadToHeadTournament[]
}
