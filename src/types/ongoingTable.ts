import type { ManualMatchResult } from './tournament.js'

export type OngoingTableStatus = 'active' | 'archived'

export interface OngoingTableSettings {
  eloTau: number
  roundRobinGamma: number
  epsilon: number
  batchPairings: boolean
}

export interface OngoingTablePlayer {
  playerId: string
  name: string
  active: boolean
  rating: number
  ratingGames: number
  provisional: boolean
  tableGames: number
  tableScore: number
  wins: number
  draws: number
  losses: number
  whiteGames: number
  blackGames: number
}

export interface OngoingTableGame {
  id: string
  tableId: string
  whitePlayerId: string
  whiteName: string
  blackPlayerId: string
  blackName: string
  result: ManualMatchResult | null
  pairingWeight: number | null
  createdAt: string
  completedAt: string | null
}

export interface OngoingPairingCandidate {
  whitePlayerId: string
  blackPlayerId: string
  whiteName: string
  blackName: string
  weight: number
  probability: number
  eloDifference: number
  gamesBetween: number
}

export interface OngoingTableDetail {
  id: string
  name: string
  status: OngoingTableStatus
  settings: OngoingTableSettings
  createdAt: string
  updatedAt: string
  players: OngoingTablePlayer[]
  games: OngoingTableGame[]
}

export interface OngoingTableSummary {
  id: string
  name: string
  status: OngoingTableStatus
  playerCount: number
  completedGames: number
  createdAt: string
  updatedAt: string
}
