export type TournamentStatus = 'setup' | 'in_progress' | 'completed'

export type ManualMatchResult = '1-0' | '0-1' | '0.5-0.5' | '0-0'
export type MatchResult = ManualMatchResult | 'BYE'
export type PlayerColor = 'W' | 'B'

export interface Player {
  id: string
  libraryPlayerId: string | null
  name: string
  seed: number
  enteredRound: number
  droppedAfterRound: number | null
}

export interface Match {
  id: string
  round: number
  board: number
  whitePlayerId: string
  blackPlayerId: string | null
  result: MatchResult | null
  isBye: boolean
}

export interface Tournament {
  id: string
  name: string
  totalRounds: number
  currentRound: number
  status: TournamentStatus
  players: Player[]
  matches: Match[]
  version: 1
  createdAt: string
  updatedAt: string
}

export interface PlayerStanding {
  playerId: string
  name: string
  seed: number
  score: number
  buchholz: number
  opponents: string[]
  colorHistory: PlayerColor[]
  receivedBye: boolean
  rank: number
}
