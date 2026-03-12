import { describe, expect, it } from 'vitest'
import { buildTournamentExport } from './export'
import type { Tournament } from '../types/tournament'

const tournament: Tournament = {
  id: 't-1',
  name: 'Spring Open',
  totalRounds: 3,
  currentRound: 2,
  status: 'in_progress',
  version: 1,
  createdAt: '2026-03-12T12:00:00.000Z',
  updatedAt: '2026-03-12T14:00:00.000Z',
  players: [
    { id: 'p1', name: 'Alice', seed: 1 },
    { id: 'p2', name: 'Bob', seed: 2 },
    { id: 'p3', name: 'Carol', seed: 3 },
  ],
  matches: [
    {
      id: 'm1',
      round: 1,
      board: 1,
      whitePlayerId: 'p1',
      blackPlayerId: 'p2',
      result: '1-0',
      isBye: false,
    },
    {
      id: 'm2',
      round: 1,
      board: 2,
      whitePlayerId: 'p3',
      blackPlayerId: null,
      result: 'BYE',
      isBye: true,
    },
    {
      id: 'm3',
      round: 2,
      board: 1,
      whitePlayerId: 'p3',
      blackPlayerId: 'p1',
      result: '0.5-0.5',
      isBye: false,
    },
  ],
}

describe('buildTournamentExport', () => {
  it('includes summary, standings, rounds, and player details', () => {
    const report = buildTournamentExport(tournament)

    expect(report).toContain('# Spring Open Tournament Report')
    expect(report).toContain('## Summary')
    expect(report).toContain('## Registration')
    expect(report).toContain('## Standings')
    expect(report).toContain('## Rounds')
    expect(report).toContain('### Round 1')
    expect(report).toContain('### Round 2')
    expect(report).toContain('## Player Details')
    expect(report).toContain('### 1. Alice')
    expect(report).toContain('| 1 | Alice | 1 | 1.5 | 1.5 | WB | No |')
    expect(report).toContain('Round 1, Board 1: White vs Bob -> 1-0')
  })
})
