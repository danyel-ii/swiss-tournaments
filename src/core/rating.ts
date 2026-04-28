import type { ManualMatchResult } from '../types/tournament'
import type { RatedResult } from '../types/rating'

export const DEFAULT_INTERNAL_RATING = 1200
export const PROVISIONAL_GAME_LIMIT = 20
export const PROVISIONAL_K = 40
export const DEFAULT_K = 32

export function isRatedResult(result: ManualMatchResult | string | null): result is RatedResult {
  return result === '1-0' || result === '0-1' || result === '0.5-0.5'
}

export function getActualScores(result: RatedResult): { white: number; black: number } {
  switch (result) {
    case '1-0':
      return { white: 1, black: 0 }
    case '0-1':
      return { white: 0, black: 1 }
    case '0.5-0.5':
      return { white: 0.5, black: 0.5 }
  }
}

export function getExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
}

export function getKFactor(gamesPlayed: number): number {
  return gamesPlayed < PROVISIONAL_GAME_LIMIT ? PROVISIONAL_K : DEFAULT_K
}

export interface RatingUpdateInput {
  whiteRating: number
  blackRating: number
  whiteGames: number
  blackGames: number
  result: RatedResult
}

export interface RatingUpdateResult {
  whiteRatingBefore: number
  blackRatingBefore: number
  whiteRatingAfter: number
  blackRatingAfter: number
  whiteDelta: number
  blackDelta: number
  kWhite: number
  kBlack: number
}

export function calculateRatingUpdate(input: RatingUpdateInput): RatingUpdateResult {
  const actual = getActualScores(input.result)
  const expectedWhite = getExpectedScore(input.whiteRating, input.blackRating)
  const expectedBlack = 1 - expectedWhite
  const kWhite = getKFactor(input.whiteGames)
  const kBlack = getKFactor(input.blackGames)
  const whiteDelta = Math.round(kWhite * (actual.white - expectedWhite))
  const blackDelta = Math.round(kBlack * (actual.black - expectedBlack))

  return {
    whiteRatingBefore: input.whiteRating,
    blackRatingBefore: input.blackRating,
    whiteRatingAfter: input.whiteRating + whiteDelta,
    blackRatingAfter: input.blackRating + blackDelta,
    whiteDelta,
    blackDelta,
    kWhite,
    kBlack,
  }
}
