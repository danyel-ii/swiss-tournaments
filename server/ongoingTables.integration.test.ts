import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { NeonQueryFunction } from '@neondatabase/serverless'

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip

describeWithDatabase('ongoing table database persistence', () => {
  const username = 'danyel-ii'
  const runId = randomUUID()
  const whitePlayerId = `test-white-${runId}`
  const blackPlayerId = `test-black-${runId}`
  const tableId = `test-table-${runId}`
  const gameId = `test-game-${runId}`
  let sql: NeonQueryFunction<false, false>
  let deleteOngoingTable: typeof import('./ongoingTables.js').deleteOngoingTable
  let upsertOngoingTableRatingSource: typeof import('./ratings.js').upsertOngoingTableRatingSource
  let recalculateUserRatings: typeof import('./ratings.js').recalculateUserRatings
  let ensureRatingSchema: typeof import('./ratings.js').ensureRatingSchema
  let listPlayerStats: typeof import('./library.js').listPlayerStats

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl

    const db = await import('./db.js')
    const ratings = await import('./ratings.js')
    const tables = await import('./ongoingTables.js')
    const library = await import('./library.js')

    sql = db.sql
    deleteOngoingTable = tables.deleteOngoingTable
    upsertOngoingTableRatingSource = ratings.upsertOngoingTableRatingSource
    recalculateUserRatings = ratings.recalculateUserRatings
    ensureRatingSchema = ratings.ensureRatingSchema
    listPlayerStats = library.listPlayerStats

    await sql`
      create table if not exists player_library (
        id text primary key,
        username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
        normalized_name text not null,
        display_name text not null,
        hidden boolean not null default false,
        created_at timestamptz not null default now(),
        unique (username, normalized_name)
      )
    `
    await ensureRatingSchema()

    await sql`
      insert into player_library (id, username, normalized_name, display_name, hidden)
      values
        (${whitePlayerId}, ${username}, ${`white-${runId}`}, 'Integration White', false),
        (${blackPlayerId}, ${username}, ${`black-${runId}`}, 'Integration Black', false)
    `
    await sql`
      insert into ongoing_tables (username, table_id, name)
      values (${username}, ${tableId}, 'Integration Table')
    `
    await sql`
      insert into ongoing_table_players (username, table_id, library_player_id, name_snapshot)
      values
        (${username}, ${tableId}, ${whitePlayerId}, 'Integration White'),
        (${username}, ${tableId}, ${blackPlayerId}, 'Integration Black')
    `
    await sql`
      insert into ongoing_table_games (
        username,
        table_id,
        game_id,
        white_library_player_id,
        black_library_player_id,
        result,
        completed_at
      )
      values (
        ${username},
        ${tableId},
        ${gameId},
        ${whitePlayerId},
        ${blackPlayerId},
        '1-0',
        '2026-03-01T00:00:00.000Z'
      )
    `
    await upsertOngoingTableRatingSource({ username, tableId, gameId })
    await recalculateUserRatings(username)
  })

  afterAll(async () => {
    if (!sql) {
      return
    }

    await sql`
      delete from rating_events
      where username = ${username}
        and source_type = 'ongoing_table'
        and source_id = ${tableId}
    `
    await sql`
      delete from rated_games
      where username = ${username}
        and source_type = 'ongoing_table'
        and source_id = ${tableId}
    `
    await sql`
      delete from ongoing_tables
      where username = ${username}
        and table_id = ${tableId}
    `
    await sql`
      delete from player_ratings
      where username = ${username}
        and library_player_id = any(${[whitePlayerId, blackPlayerId]})
    `
    await sql`
      delete from player_library
      where username = ${username}
        and id = any(${[whitePlayerId, blackPlayerId]})
    `
  })

  it('keeps rated games, ratings, and stats after deleting the table', async () => {
    const deleted = await deleteOngoingTable(username, tableId)

    expect(deleted).toBe(true)

    const [tableRows, ratedRows, ratingRows] = await Promise.all([
      sql`
        select table_id
        from ongoing_tables
        where username = ${username}
          and table_id = ${tableId}
      `,
      sql`
        select source_game_id
        from rated_games
        where username = ${username}
          and source_type = 'ongoing_table'
          and source_id = ${tableId}
          and source_game_id = ${gameId}
      `,
      sql`
        select library_player_id, rating, games
        from player_ratings
        where username = ${username}
          and library_player_id = any(${[whitePlayerId, blackPlayerId]})
      `,
    ])

    expect(tableRows).toHaveLength(0)
    expect(ratedRows).toHaveLength(1)
    expect(ratingRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ library_player_id: whitePlayerId, games: 1 }),
        expect.objectContaining({ library_player_id: blackPlayerId, games: 1 }),
      ]),
    )

    const summaries = await listPlayerStats(username)
    const whiteSummary = summaries.find((summary) => summary.playerId === whitePlayerId)
    const blackSummary = summaries.find((summary) => summary.playerId === blackPlayerId)

    expect(whiteSummary).toMatchObject({
      gamesPlayed: 1,
      totalScore: 1,
      wins: 1,
      whiteGames: 1,
    })
    expect(blackSummary).toMatchObject({
      gamesPlayed: 1,
      totalScore: 0,
      losses: 1,
      blackGames: 1,
    })
  })
})
