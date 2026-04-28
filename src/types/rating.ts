export type RatedResult = '1-0' | '0-1' | '0.5-0.5'
export type RatingSourceType = 'tournament' | 'ongoing_table'

export interface PlayerRating {
  playerId: string
  rating: number
  games: number
  provisional: boolean
  updatedAt: string | null
}

export interface RatingEvent {
  id: string
  sequenceNumber: number
  sourceType: RatingSourceType
  sourceId: string
  sourceGameId: string
  whitePlayerId: string
  blackPlayerId: string
  result: RatedResult
  whiteRatingBefore: number
  blackRatingBefore: number
  whiteRatingAfter: number
  blackRatingAfter: number
  whiteDelta: number
  blackDelta: number
  kWhite: number
  kBlack: number
  playedAt: string
  createdAt: string
}
