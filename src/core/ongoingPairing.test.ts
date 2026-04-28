import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ONGOING_TABLE_SETTINGS,
  buildOngoingPairingCandidates,
  selectWeightedPairing,
  selectWeightedPairingBatch,
  type OngoingPairingGameInput,
  type OngoingPairingPlayerInput,
} from './ongoingPairing'

const players: OngoingPairingPlayerInput[] = [
  { playerId: 'a', name: 'Ada', rating: 1200, tableGames: 0, whiteGames: 0, blackGames: 0 },
  { playerId: 'b', name: 'Ben', rating: 1210, tableGames: 0, whiteGames: 0, blackGames: 0 },
  { playerId: 'c', name: 'Cy', rating: 1500, tableGames: 0, whiteGames: 0, blackGames: 0 },
  { playerId: 'd', name: 'Dee', rating: 900, tableGames: 0, whiteGames: 0, blackGames: 0 },
]

describe('ongoing pairing', () => {
  it('returns no candidates with fewer than two players', () => {
    expect(
      buildOngoingPairingCandidates({
        players: [],
        games: [],
        settings: DEFAULT_ONGOING_TABLE_SETTINGS,
      }),
    ).toEqual([])
    expect(
      buildOngoingPairingCandidates({
        players: [players[0]],
        games: [],
        settings: DEFAULT_ONGOING_TABLE_SETTINGS,
      }),
    ).toEqual([])
    expect(selectWeightedPairing([], () => 0)).toBeNull()
  })

  it('generates every pair for four players', () => {
    const candidates = buildOngoingPairingCandidates({
      players,
      games: [],
      settings: DEFAULT_ONGOING_TABLE_SETTINGS,
    })

    expect(candidates).toHaveLength(6)
  })

  it('assigns positive weights and probabilities that sum to one', () => {
    const candidates = buildOngoingPairingCandidates({
      players,
      games: [],
      settings: DEFAULT_ONGOING_TABLE_SETTINGS,
    })

    expect(candidates.every((candidate) => candidate.weight > 0)).toBe(true)
    expect(candidates.every((candidate) => candidate.probability > 0)).toBe(true)
    expect(candidates.reduce((total, candidate) => total + candidate.probability, 0)).toBeCloseTo(1)
  })

  it('keeps non-zero weights when epsilon is configured as zero', () => {
    const candidates = buildOngoingPairingCandidates({
      players: [
        { playerId: 'a', name: 'Ada', rating: 1200, tableGames: 0, whiteGames: 0, blackGames: 0 },
        { playerId: 'b', name: 'Ben', rating: 3000, tableGames: 0, whiteGames: 0, blackGames: 0 },
      ],
      games: [],
      settings: { ...DEFAULT_ONGOING_TABLE_SETTINGS, epsilon: 0 },
    })

    expect(candidates).toHaveLength(1)
    expect(candidates[0].weight).toBeGreaterThan(0)
    expect(candidates[0].probability).toBe(1)
  })

  it('prefers close Elo pairs when history is equal', () => {
    const candidates = buildOngoingPairingCandidates({
      players,
      games: [],
      settings: DEFAULT_ONGOING_TABLE_SETTINGS,
    })
    const close = candidates.find((candidate) =>
      [candidate.whitePlayerId, candidate.blackPlayerId].includes('a') &&
      [candidate.whitePlayerId, candidate.blackPlayerId].includes('b'),
    )
    const far = candidates.find((candidate) =>
      [candidate.whitePlayerId, candidate.blackPlayerId].includes('a') &&
      [candidate.whitePlayerId, candidate.blackPlayerId].includes('c'),
    )

    expect(close?.weight).toBeGreaterThan(far?.weight ?? 0)
  })

  it('reduces repeated pair weight relative to a comparable fresh pair', () => {
    const games: OngoingPairingGameInput[] = [
      {
        whitePlayerId: 'a',
        blackPlayerId: 'b',
        result: '1-0',
        completedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    const candidates = buildOngoingPairingCandidates({
      players: [
        { playerId: 'a', name: 'Ada', rating: 1200, tableGames: 1, whiteGames: 1, blackGames: 0 },
        { playerId: 'b', name: 'Ben', rating: 1210, tableGames: 1, whiteGames: 0, blackGames: 1 },
        { playerId: 'e', name: 'Eli', rating: 1210, tableGames: 0, whiteGames: 0, blackGames: 0 },
      ],
      games,
      settings: DEFAULT_ONGOING_TABLE_SETTINGS,
    })
    const repeated = candidates.find((candidate) =>
      [candidate.whitePlayerId, candidate.blackPlayerId].includes('a') &&
      [candidate.whitePlayerId, candidate.blackPlayerId].includes('b'),
    )
    const fresh = candidates.find((candidate) =>
      [candidate.whitePlayerId, candidate.blackPlayerId].includes('a') &&
      [candidate.whitePlayerId, candidate.blackPlayerId].includes('e'),
    )

    expect(repeated?.weight).toBeLessThan(fresh?.weight ?? 0)
  })

  it('discourages recent repeats more than older history', () => {
    const oldOnly = buildOngoingPairingCandidates({
      players: [
        { playerId: 'a', name: 'Ada', rating: 1200, tableGames: 1, whiteGames: 1, blackGames: 0 },
        { playerId: 'b', name: 'Ben', rating: 1200, tableGames: 1, whiteGames: 0, blackGames: 1 },
      ],
      games: [
        {
          whitePlayerId: 'a',
          blackPlayerId: 'b',
          result: '1-0',
          completedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        ...players.slice(0, 4).map((player, index) => ({
          whitePlayerId: player.playerId,
          blackPlayerId: index % 2 === 0 ? 'x' : 'y',
          result: '1-0',
          completedAt: `2026-01-0${index + 2}T00:00:00.000Z`,
          createdAt: `2026-01-0${index + 2}T00:00:00.000Z`,
        })),
      ],
      settings: DEFAULT_ONGOING_TABLE_SETTINGS,
    })[0]
    const recent = buildOngoingPairingCandidates({
      players: [
        { playerId: 'a', name: 'Ada', rating: 1200, tableGames: 1, whiteGames: 1, blackGames: 0 },
        { playerId: 'b', name: 'Ben', rating: 1200, tableGames: 1, whiteGames: 0, blackGames: 1 },
      ],
      games: [
        {
          whitePlayerId: 'a',
          blackPlayerId: 'b',
          result: '1-0',
          completedAt: '2026-01-05T00:00:00.000Z',
          createdAt: '2026-01-05T00:00:00.000Z',
        },
      ],
      settings: DEFAULT_ONGOING_TABLE_SETTINGS,
    })[0]

    expect(recent.weight).toBeLessThan(oldOnly.weight)
  })

  it('gives White to the player with more black games', () => {
    const [candidate] = buildOngoingPairingCandidates({
      players: [
        { playerId: 'a', name: 'Ada', rating: 1200, tableGames: 3, whiteGames: 0, blackGames: 3 },
        { playerId: 'b', name: 'Ben', rating: 1200, tableGames: 3, whiteGames: 3, blackGames: 0 },
      ],
      games: [],
      settings: DEFAULT_ONGOING_TABLE_SETTINGS,
    })

    expect(candidate.whitePlayerId).toBe('a')
    expect(candidate.blackPlayerId).toBe('b')
  })

  it('returns disjoint batch pairs', () => {
    const batch = selectWeightedPairingBatch({
      players,
      games: [],
      settings: DEFAULT_ONGOING_TABLE_SETTINGS,
      random: () => 0,
    })
    const ids = batch.flatMap((candidate) => [candidate.whitePlayerId, candidate.blackPlayerId])

    expect(batch).toHaveLength(2)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('supports deterministic weighted selection', () => {
    const candidates = buildOngoingPairingCandidates({
      players,
      games: [],
      settings: DEFAULT_ONGOING_TABLE_SETTINGS,
    })

    expect(selectWeightedPairing(candidates, () => 0)).toEqual(candidates[0])
    expect(selectWeightedPairing(candidates, () => 0.999999)).toEqual(candidates[candidates.length - 1])
  })
})
