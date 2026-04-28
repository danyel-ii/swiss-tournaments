import { beforeEach, describe, expect, it, vi } from 'vitest'

const sqlMock = vi.fn()

vi.mock('./db.js', () => ({
  sql: sqlMock,
}))

vi.mock('./ratings.js', () => ({
  ensureRatingSchema: vi.fn(async () => undefined),
  recalculateUserRatings: vi.fn(async () => undefined),
  syncTournamentRatingSourcesFromProjection: vi.fn(async () => undefined),
}))

const libraryRows = [
  {
    id: 'player-a',
    display_name: 'Ada',
    created_at: '2026-01-01T00:00:00.000Z',
    internal_rating: 1220,
    rating_games: 2,
    rating_provisional: true,
  },
  {
    id: 'player-b',
    display_name: 'Ben',
    created_at: '2026-01-01T00:00:00.000Z',
    internal_rating: 1180,
    rating_games: 1,
    rating_provisional: true,
  },
  {
    id: 'player-c',
    display_name: 'Cy',
    created_at: '2026-01-01T00:00:00.000Z',
    internal_rating: 1200,
    rating_games: 1,
    rating_provisional: true,
  },
]

const ongoingRatedGames = [
  {
    source_game_id: 'ongoing-1',
    white_library_player_id: 'player-a',
    black_library_player_id: 'player-b',
    result: '1-0',
    played_at: '2026-02-01T00:00:00.000Z',
  },
  {
    source_game_id: 'ongoing-2',
    white_library_player_id: 'player-c',
    black_library_player_id: 'player-a',
    result: '0.5-0.5',
    played_at: '2026-02-02T00:00:00.000Z',
  },
]

function createSqlMockResponse(query: string): unknown[] {
  if (query.includes('select') && query.includes('pl.id') && query.includes('from player_library pl')) {
    return libraryRows
  }

  if (query.includes('select tournament_id, name, status')) {
    return []
  }

  if (query.includes('select') && query.includes('tournament_player_id')) {
    return []
  }

  if (query.includes('select') && query.includes('match_id')) {
    return []
  }

  if (query.includes('from rated_games') && query.includes("source_type = 'ongoing_table'")) {
    return ongoingRatedGames
  }

  return []
}

describe('library statistics', () => {
  beforeEach(() => {
    sqlMock.mockImplementation(async (strings: TemplateStringsArray) =>
      createSqlMockResponse(strings.join('')),
    )
  })

  it('includes ongoing table rated games in player summaries without tournament projections', async () => {
    const { listPlayerStats } = await import('./library.js')
    const summaries = await listPlayerStats('danyel-ii')
    const ada = summaries.find((summary) => summary.playerId === 'player-a')
    const ben = summaries.find((summary) => summary.playerId === 'player-b')
    const cy = summaries.find((summary) => summary.playerId === 'player-c')

    expect(ada).toMatchObject({
      playerId: 'player-a',
      gamesPlayed: 2,
      totalScore: 1.5,
      wins: 1,
      draws: 1,
      losses: 0,
      whiteGames: 1,
      blackGames: 1,
      tournamentsPlayed: 0,
      internalRating: 1220,
      ratingGames: 2,
    })
    expect(ada?.scorePercentage).toBe(0.75)
    expect(ada?.lastPlayedAt).toBe('2026-02-02T00:00:00.000Z')

    expect(ben).toMatchObject({
      playerId: 'player-b',
      gamesPlayed: 1,
      totalScore: 0,
      wins: 0,
      draws: 0,
      losses: 1,
      whiteGames: 0,
      blackGames: 1,
    })

    expect(cy).toMatchObject({
      playerId: 'player-c',
      gamesPlayed: 1,
      totalScore: 0.5,
      wins: 0,
      draws: 1,
      losses: 0,
      whiteGames: 1,
      blackGames: 0,
    })
  })
})
