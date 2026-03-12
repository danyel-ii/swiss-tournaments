import { describe, expect, it } from 'vitest'
import { getPlayerBuchholz, getPlayerScore, getStandings, isCurrentRoundComplete } from './ranking'
import { createDefaultTournament, setMatchResult, startTournament } from './tournament'
import { generateRoundOnePairings, generateSwissRoundPairings } from './swissPairing'
import type { Match, Player } from '../types/tournament'

function createPlayers(names: string[]): Player[] {
  return names.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    seed: index + 1,
  }))
}

function createMatch(match: Partial<Match> & Pick<Match, 'id' | 'round' | 'board' | 'whitePlayerId'>): Match {
  return {
    blackPlayerId: null,
    result: null,
    isBye: false,
    ...match,
  }
}

describe('ranking', () => {
  it('calculates score from all supported result types', () => {
    const players = createPlayers(['Alice', 'Bob', 'Carol', 'David', 'Eva'])
    const matches: Match[] = [
      createMatch({
        id: 'm1',
        round: 1,
        board: 1,
        whitePlayerId: players[0].id,
        blackPlayerId: players[1].id,
        result: '1-0',
      }),
      createMatch({
        id: 'm2',
        round: 1,
        board: 2,
        whitePlayerId: players[2].id,
        blackPlayerId: players[3].id,
        result: '0-1',
      }),
      createMatch({
        id: 'm3',
        round: 2,
        board: 1,
        whitePlayerId: players[0].id,
        blackPlayerId: players[2].id,
        result: '0.5-0.5',
      }),
      createMatch({
        id: 'm4',
        round: 2,
        board: 2,
        whitePlayerId: players[1].id,
        blackPlayerId: players[3].id,
        result: '0-0',
      }),
      createMatch({
        id: 'm5',
        round: 2,
        board: 3,
        whitePlayerId: players[4].id,
        result: 'BYE',
        isBye: true,
      }),
    ]

    expect(getPlayerScore(players[0].id, matches)).toBe(1.5)
    expect(getPlayerScore(players[1].id, matches)).toBe(0)
    expect(getPlayerScore(players[2].id, matches)).toBe(0.5)
    expect(getPlayerScore(players[3].id, matches)).toBe(1)
    expect(getPlayerScore(players[4].id, matches)).toBe(1)
  })

  it('computes Buchholz using completed opponents only and ignores byes', () => {
    const players = createPlayers(['Alice', 'Bob', 'Carol'])
    const matches: Match[] = [
      createMatch({
        id: 'm1',
        round: 1,
        board: 1,
        whitePlayerId: players[0].id,
        blackPlayerId: players[1].id,
        result: '1-0',
      }),
      createMatch({
        id: 'm2',
        round: 1,
        board: 2,
        whitePlayerId: players[2].id,
        result: 'BYE',
        isBye: true,
      }),
      createMatch({
        id: 'm3',
        round: 2,
        board: 1,
        whitePlayerId: players[0].id,
        blackPlayerId: players[2].id,
        result: '0-1',
      }),
    ]

    expect(getPlayerBuchholz(players[0].id, players, matches)).toBe(2)
    expect(getPlayerBuchholz(players[2].id, players, matches)).toBe(1)
  })

  it('sorts standings by score, Buchholz, seed, then name', () => {
    const players = createPlayers(['Alice', 'Bob', 'Alice'])
    const matches: Match[] = [
      createMatch({
        id: 'm1',
        round: 1,
        board: 1,
        whitePlayerId: players[0].id,
        blackPlayerId: players[1].id,
        result: '1-0',
      }),
      createMatch({
        id: 'm2',
        round: 1,
        board: 2,
        whitePlayerId: players[2].id,
        result: 'BYE',
        isBye: true,
      }),
    ]

    const standings = getStandings(players, matches)

    expect(standings.map((entry) => entry.seed)).toEqual([1, 3, 2])
  })
})

describe('pairings', () => {
  it('generates round 1 pairings for even player count', () => {
    const players = createPlayers(['Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Henry'])
    const pairings = generateRoundOnePairings(players)

    expect(
      pairings.map((match) => [match.board, match.whitePlayerId, match.blackPlayerId]),
    ).toEqual([
      [1, 'player-1', 'player-5'],
      [2, 'player-6', 'player-2'],
      [3, 'player-3', 'player-7'],
      [4, 'player-8', 'player-4'],
    ])
  })

  it('generates round 1 pairings for odd player count with a bye', () => {
    const players = createPlayers(['Alice', 'Bob', 'Carol', 'David', 'Eva'])
    const pairings = generateRoundOnePairings(players)

    expect(pairings.at(-1)).toMatchObject({
      whitePlayerId: 'player-5',
      blackPlayerId: null,
      result: 'BYE',
      isBye: true,
    })
    expect(pairings.slice(0, 2).map((match) => [match.whitePlayerId, match.blackPlayerId])).toEqual([
      ['player-1', 'player-3'],
      ['player-4', 'player-2'],
    ])
  })

  it('avoids repeat pairings when a non-repeat solution exists', () => {
    const players = createPlayers(['A', 'B', 'C', 'D'])
    const matches: Match[] = [
      createMatch({
        id: 'm1',
        round: 1,
        board: 1,
        whitePlayerId: players[0].id,
        blackPlayerId: players[1].id,
        result: '1-0',
      }),
      createMatch({
        id: 'm2',
        round: 1,
        board: 2,
        whitePlayerId: players[2].id,
        blackPlayerId: players[3].id,
        result: '1-0',
      }),
    ]

    const pairings = generateSwissRoundPairings(players, matches, 2)
    const pairedIds = pairings.map((match) => [match.whitePlayerId, match.blackPlayerId].sort().join('-'))

    expect(pairedIds).toContain('player-1-player-3')
    expect(pairedIds).toContain('player-2-player-4')
  })

  it('gives at most one bye when another lower-ranked eligible player exists', () => {
    const players = createPlayers(['A', 'B', 'C', 'D', 'E'])
    const matches: Match[] = [
      createMatch({
        id: 'm1',
        round: 1,
        board: 1,
        whitePlayerId: players[0].id,
        blackPlayerId: players[2].id,
        result: '1-0',
      }),
      createMatch({
        id: 'm2',
        round: 1,
        board: 2,
        whitePlayerId: players[3].id,
        blackPlayerId: players[1].id,
        result: '0-1',
      }),
      createMatch({
        id: 'm3',
        round: 1,
        board: 3,
        whitePlayerId: players[4].id,
        result: 'BYE',
        isBye: true,
      }),
    ]

    const pairings = generateSwissRoundPairings(players, matches, 2)
    const byeMatch = pairings.find((match) => match.isBye)

    expect(byeMatch?.whitePlayerId).not.toBe(players[4].id)
  })
})

describe('tournament progression', () => {
  it('blocks next round generation when the current round is incomplete', () => {
    const baseTournament = createDefaultTournament()
    const startedTournament = startTournament({
      ...baseTournament,
      players: createPlayers(['Alice', 'Bob', 'Carol', 'David']),
      totalRounds: 3,
    })

    expect(isCurrentRoundComplete(startedTournament.matches, 1)).toBe(false)

    const unchanged = setMatchResult(startedTournament, 'missing', '1-0')

    expect(unchanged.currentRound).toBe(1)
  })
})
