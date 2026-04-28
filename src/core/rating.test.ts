import { describe, expect, it } from 'vitest'
import {
  DEFAULT_K,
  PROVISIONAL_GAME_LIMIT,
  PROVISIONAL_K,
  calculateRatingUpdate,
  getExpectedScore,
  getKFactor,
  isRatedResult,
} from './rating'

describe('rating', () => {
  it('calculates a provisional white win from equal ratings', () => {
    const update = calculateRatingUpdate({
      whiteRating: 1200,
      blackRating: 1200,
      whiteGames: 0,
      blackGames: 0,
      result: '1-0',
    })

    expect(update.whiteDelta).toBe(20)
    expect(update.blackDelta).toBe(-20)
    expect(update.whiteRatingAfter).toBe(1220)
    expect(update.blackRatingAfter).toBe(1180)
  })

  it('keeps equal ratings unchanged on a draw', () => {
    const update = calculateRatingUpdate({
      whiteRating: 1200,
      blackRating: 1200,
      whiteGames: 0,
      blackGames: 0,
      result: '0.5-0.5',
    })

    expect(update.whiteDelta).toBe(0)
    expect(update.blackDelta).toBe(0)
  })

  it('calculates black wins with the same expected score model', () => {
    const update = calculateRatingUpdate({
      whiteRating: 1200,
      blackRating: 1200,
      whiteGames: 0,
      blackGames: 0,
      result: '0-1',
    })

    expect(update.whiteDelta).toBe(-20)
    expect(update.blackDelta).toBe(20)
  })

  it('gives a higher-rated player less for an expected win', () => {
    const update = calculateRatingUpdate({
      whiteRating: 1400,
      blackRating: 1200,
      whiteGames: 0,
      blackGames: 0,
      result: '1-0',
    })

    expect(update.whiteDelta).toBeLessThan(20)
    expect(update.blackDelta).toBeGreaterThan(-20)
  })

  it('gives a lower-rated player more for an upset', () => {
    const update = calculateRatingUpdate({
      whiteRating: 1200,
      blackRating: 1400,
      whiteGames: 0,
      blackGames: 0,
      result: '1-0',
    })

    expect(update.whiteDelta).toBeGreaterThan(20)
    expect(update.blackDelta).toBeLessThan(-20)
  })

  it('ignores unrated result values', () => {
    expect(isRatedResult('1-0')).toBe(true)
    expect(isRatedResult('0-0')).toBe(false)
    expect(isRatedResult('BYE')).toBe(false)
    expect(isRatedResult(null)).toBe(false)
  })

  it('uses provisional K until the game limit', () => {
    expect(getKFactor(PROVISIONAL_GAME_LIMIT - 1)).toBe(PROVISIONAL_K)
    expect(getKFactor(PROVISIONAL_GAME_LIMIT)).toBe(DEFAULT_K)
  })

  it('allows mixed K factors for provisional versus established players', () => {
    const update = calculateRatingUpdate({
      whiteRating: 1200,
      blackRating: 1200,
      whiteGames: PROVISIONAL_GAME_LIMIT,
      blackGames: 0,
      result: '1-0',
    })

    expect(update.kWhite).toBe(DEFAULT_K)
    expect(update.kBlack).toBe(PROVISIONAL_K)
    expect(update.whiteDelta).toBe(16)
    expect(update.blackDelta).toBe(-20)
  })

  it('computes standard expected score', () => {
    expect(getExpectedScore(1200, 1200)).toBeCloseTo(0.5)
    expect(getExpectedScore(1400, 1200)).toBeGreaterThan(0.5)
  })
})
