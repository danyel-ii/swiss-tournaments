import { describe, expect, it } from 'vitest'
import { getPlayerBuchholz, getPlayerScore, getStandings, isCurrentRoundComplete } from './ranking'
import {
  addPlayer,
  createDefaultTournament,
  generateNextRound,
  removePlayer,
  renamePlayer,
  setPairingAlgorithm,
  setMatchResult,
  startTournament,
} from './tournament'
import { generateRoundOnePairings, generateSwissRoundPairings } from './swissPairing'
import type { Match, Player } from '../types/tournament'

function createPlayers(names: string[]): Player[] {
  return names.map((name, index) => ({
    id: `player-${index + 1}`,
    libraryPlayerId: null,
    name,
    seed: index + 1,
    enteredRound: 1,
    droppedAfterRound: null,
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

  it('generates a bye-only round when one player remains active', () => {
    const players = createPlayers(['A'])
    const pairings = generateSwissRoundPairings(players, [], 2, 'blossom')

    expect(pairings).toEqual([
      expect.objectContaining({
        whitePlayerId: players[0].id,
        blackPlayerId: null,
        result: 'BYE',
        isBye: true,
      }),
    ])
  })

  it('generates round 2 pairings for a large field with late entrants without hanging', () => {
    const roundOnePlayers = createPlayers(
      Array.from({ length: 26 }, (_, index) => `Player ${index + 1}`),
    )
    const lateEntrants: Player[] = Array.from({ length: 3 }, (_, index) => ({
      id: `late-player-${index + 1}`,
      libraryPlayerId: null,
      name: `Late ${index + 1}`,
      seed: roundOnePlayers.length + index + 1,
      enteredRound: 2,
      droppedAfterRound: null,
    }))
    const players = [...roundOnePlayers, ...lateEntrants]
    const matches: Match[] = []

    for (let index = 0; index < 11; index += 1) {
      matches.push(
        createMatch({
          id: `win-${index + 1}`,
          round: 1,
          board: index + 1,
          whitePlayerId: roundOnePlayers[index * 2].id,
          blackPlayerId: roundOnePlayers[index * 2 + 1].id,
          result: '1-0',
        }),
      )
    }

    for (let index = 0; index < 2; index += 1) {
      const baseIndex = 22 + index * 2
      matches.push(
        createMatch({
          id: `draw-${index + 1}`,
          round: 1,
          board: matches.length + 1,
          whitePlayerId: roundOnePlayers[baseIndex].id,
          blackPlayerId: roundOnePlayers[baseIndex + 1].id,
          result: '0.5-0.5',
        }),
      )
    }

    const pairings = generateSwissRoundPairings(players, matches, 2)
    const byeMatches = pairings.filter((match) => match.isBye)
    const pairedPlayerIds = new Set(
      pairings.flatMap((match) => [match.whitePlayerId, match.blackPlayerId]).filter(Boolean),
    )

    expect(pairings).toHaveLength(15)
    expect(byeMatches).toHaveLength(1)
    expect(pairedPlayerIds.size).toBe(29)
  })

  it('supports the balanced pairing mode as an alternative pairing engine', () => {
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

    const pairings = generateSwissRoundPairings(players, matches, 2, 'blossom')
    const pairedIds = pairings.map((match) => [match.whitePlayerId, match.blackPlayerId].sort().join('-'))

    expect(pairedIds).toContain('player-1-player-3')
    expect(pairedIds).toContain('player-2-player-4')
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

  it('awards a 1-0 result only to the white player in standings', () => {
    const baseTournament = createDefaultTournament()
    const startedTournament = startTournament({
      ...baseTournament,
      players: createPlayers(['Alice', 'Bob']),
      totalRounds: 1,
    })
    const boardOne = startedTournament.matches[0]

    expect(boardOne.blackPlayerId).not.toBeNull()

    const updatedTournament = setMatchResult(startedTournament, boardOne.id, '1-0')
    const standings = getStandings(updatedTournament.players, updatedTournament.matches)
    const whiteStanding = standings.find((entry) => entry.playerId === boardOne.whitePlayerId)
    const blackStanding = standings.find((entry) => entry.playerId === boardOne.blackPlayerId)

    expect(whiteStanding?.score).toBe(1)
    expect(blackStanding?.score).toBe(0)
  })

  it('allows player renames after the tournament has started', () => {
    const baseTournament = createDefaultTournament()
    const startedTournament = startTournament({
      ...baseTournament,
      players: createPlayers(['Alice', 'Bob']),
      totalRounds: 2,
    })

    const renamedTournament = renamePlayer(
      startedTournament,
      startedTournament.players[0].id,
      'Alicia',
    )

    expect(renamedTournament.players[0].name).toBe('Alicia')
    expect(renamedTournament.matches).toEqual(startedTournament.matches)
  })

  it('allows pairing algorithm selection only during setup', () => {
    const setupTournament = createDefaultTournament()
    const blossomTournament = setPairingAlgorithm(setupTournament, 'blossom')

    expect(blossomTournament.pairingAlgorithm).toBe('blossom')

    const startedTournament = startTournament({
      ...blossomTournament,
      players: createPlayers(['Alice', 'Bob', 'Carol', 'David']),
      totalRounds: 3,
    })

    expect(setPairingAlgorithm(startedTournament, 'greedy').pairingAlgorithm).toBe('blossom')
  })

  it('adds late entrants to the next round only', () => {
    const baseTournament = createDefaultTournament()
    const startedTournament = startTournament({
      ...baseTournament,
      players: createPlayers(['Alice', 'Bob', 'Carol', 'David']),
      totalRounds: 3,
    })
    const withLateEntry = addPlayer(startedTournament, 'Eva')

    expect(withLateEntry.players.at(-1)).toMatchObject({
      name: 'Eva',
      enteredRound: 2,
      droppedAfterRound: null,
    })
    expect(withLateEntry.matches.some((match) => match.whitePlayerId === withLateEntry.players.at(-1)?.id)).toBe(
      false,
    )

    const roundOneCompleted = withLateEntry.matches.reduce((tournament, match) => {
      if (match.isBye) {
        return tournament
      }

      return setMatchResult(tournament, match.id, '1-0')
    }, withLateEntry)
    const roundTwoTournament = generateNextRound(roundOneCompleted)
    const latePlayerId = roundTwoTournament.players.at(-1)?.id

    expect(roundTwoTournament.currentRound).toBe(2)
    expect(
      roundTwoTournament.matches.some(
        (match) =>
          match.round === 2 &&
          (match.whitePlayerId === latePlayerId || match.blackPlayerId === latePlayerId),
      ),
    ).toBe(true)
  })

  it('drops players after the current round instead of deleting their history', () => {
    const baseTournament = createDefaultTournament()
    const startedTournament = startTournament({
      ...baseTournament,
      players: createPlayers(['Alice', 'Bob', 'Carol', 'David']),
      totalRounds: 3,
    })
    const playerToDrop = startedTournament.players[0]
    const updatedTournament = removePlayer(startedTournament, playerToDrop.id)

    expect(updatedTournament.players).toHaveLength(4)
    expect(updatedTournament.players[0].droppedAfterRound).toBe(1)

    const roundOneCompleted = updatedTournament.matches.reduce((tournament, match) => {
      if (match.isBye) {
        return tournament
      }

      return setMatchResult(tournament, match.id, '1-0')
    }, updatedTournament)
    const roundTwoTournament = generateNextRound(roundOneCompleted)

    expect(
      roundTwoTournament.matches.some(
        (match) =>
          match.round === 2 &&
          (match.whitePlayerId === playerToDrop.id || match.blackPlayerId === playerToDrop.id),
      ),
    ).toBe(false)
  })

  it('rewinds the tournament when a past-round result is corrected', () => {
    const baseTournament = createDefaultTournament()
    const startedTournament = startTournament({
      ...baseTournament,
      players: createPlayers(['Alice', 'Bob', 'Carol', 'David']),
      totalRounds: 3,
    })

    const roundOneCompleted = startedTournament.matches.reduce((tournament, match) => {
      if (match.isBye) {
        return tournament
      }

      return setMatchResult(tournament, match.id, '1-0')
    }, startedTournament)
    const roundTwoTournament = generateNextRound(roundOneCompleted)
    const firstRoundMatch = roundTwoTournament.matches.find((match) => match.round === 1 && !match.isBye)

    expect(roundTwoTournament.currentRound).toBe(2)
    expect(firstRoundMatch).toBeDefined()

    const correctedTournament = setMatchResult(
      roundTwoTournament,
      firstRoundMatch!.id,
      '0-1',
    )

    expect(correctedTournament.currentRound).toBe(1)
    expect(correctedTournament.status).toBe('in_progress')
    expect(correctedTournament.matches.every((match) => match.round <= 1)).toBe(true)
    expect(correctedTournament.matches.find((match) => match.id === firstRoundMatch!.id)?.result).toBe('0-1')
  })

  it('keeps current-round edits in place without truncating later rounds', () => {
    const baseTournament = createDefaultTournament()
    const startedTournament = startTournament({
      ...baseTournament,
      players: createPlayers(['Alice', 'Bob', 'Carol', 'David']),
      totalRounds: 3,
    })

    const currentRoundMatch = startedTournament.matches.find((match) => !match.isBye)

    expect(currentRoundMatch).toBeDefined()

    const updatedTournament = setMatchResult(startedTournament, currentRoundMatch!.id, '1-0')

    expect(updatedTournament.currentRound).toBe(1)
    expect(updatedTournament.matches).toHaveLength(startedTournament.matches.length)
    expect(updatedTournament.matches.find((match) => match.id === currentRoundMatch!.id)?.result).toBe('1-0')
  })
})
