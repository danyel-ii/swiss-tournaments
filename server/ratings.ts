import { sql } from './db.js'
import type { AllowedUsername } from './config.js'
import {
  DEFAULT_INTERNAL_RATING,
  PROVISIONAL_GAME_LIMIT,
  calculateRatingUpdate,
  isRatedResult,
} from '../src/core/rating.js'
import type { RatedResult, RatingEvent, PlayerRating, RatingSourceType } from '../src/types/rating.js'

interface LibraryRatingRow {
  id: string
}

interface RatedGameRow {
  source_type: RatingSourceType
  source_id: string
  source_game_id: string
  white_library_player_id: string
  black_library_player_id: string
  result: RatedResult
  played_at: string
}

let ensureRatingSchemaPromise: Promise<void> | null = null

export async function ensureRatingSchema(): Promise<void> {
  if (!ensureRatingSchemaPromise) {
    ensureRatingSchemaPromise = (async () => {
      await sql`
        create table if not exists player_ratings (
          username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
          library_player_id text not null references player_library(id) on delete cascade,
          rating integer not null default 1200,
          games integer not null default 0,
          provisional boolean not null default true,
          updated_at timestamptz not null default now(),
          primary key (username, library_player_id)
        )
      `
      await sql`create index if not exists player_ratings_username_idx on player_ratings (username)`

      await sql`
        create table if not exists rated_games (
          username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
          source_type text not null check (source_type in ('tournament', 'ongoing_table')),
          source_id text not null,
          source_game_id text not null,
          white_library_player_id text not null references player_library(id) on delete cascade,
          black_library_player_id text not null references player_library(id) on delete cascade,
          result text not null check (result in ('1-0', '0-1', '0.5-0.5')),
          played_at timestamptz not null,
          source_order integer not null default 0,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          primary key (username, source_type, source_id, source_game_id)
        )
      `
      await sql`
        create index if not exists rated_games_username_order_idx
        on rated_games (username, played_at, source_order, source_type, source_id, source_game_id)
      `
      await sql`create index if not exists rated_games_white_player_idx on rated_games (white_library_player_id)`
      await sql`create index if not exists rated_games_black_player_idx on rated_games (black_library_player_id)`

      await sql`
        create table if not exists rating_events (
          id text primary key,
          username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
          sequence_number integer not null,
          source_type text not null check (source_type in ('tournament', 'ongoing_table')),
          source_id text not null,
          source_game_id text not null,
          white_library_player_id text not null references player_library(id) on delete cascade,
          black_library_player_id text not null references player_library(id) on delete cascade,
          result text not null check (result in ('1-0', '0-1', '0.5-0.5')),
          white_rating_before integer not null,
          black_rating_before integer not null,
          white_rating_after integer not null,
          black_rating_after integer not null,
          white_delta integer not null,
          black_delta integer not null,
          k_white integer not null,
          k_black integer not null,
          played_at timestamptz not null,
          created_at timestamptz not null default now(),
          unique (username, source_type, source_id, source_game_id)
        )
      `
      await sql`
        create index if not exists rating_events_username_sequence_idx
        on rating_events (username, sequence_number)
      `
      await sql`create index if not exists rating_events_white_player_idx on rating_events (white_library_player_id)`
      await sql`create index if not exists rating_events_black_player_idx on rating_events (black_library_player_id)`

      await sql`
        create table if not exists ongoing_tables (
          username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
          table_id text not null,
          name text not null,
          status text not null default 'active' check (status in ('active', 'archived')),
          settings jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          primary key (username, table_id)
        )
      `
      await sql`
        create index if not exists ongoing_tables_username_idx
        on ongoing_tables (username, updated_at desc)
      `
      await sql`
        create table if not exists ongoing_table_players (
          username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
          table_id text not null,
          library_player_id text not null references player_library(id) on delete cascade,
          name_snapshot text not null,
          active boolean not null default true,
          joined_at timestamptz not null default now(),
          removed_at timestamptz,
          primary key (username, table_id, library_player_id),
          foreign key (username, table_id)
            references ongoing_tables(username, table_id)
            on delete cascade
        )
      `
      await sql`
        create index if not exists ongoing_table_players_player_idx
        on ongoing_table_players (library_player_id)
      `
      await sql`
        create table if not exists ongoing_table_games (
          username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
          table_id text not null,
          game_id text not null,
          white_library_player_id text not null references player_library(id) on delete cascade,
          black_library_player_id text not null references player_library(id) on delete cascade,
          result text check (result in ('1-0', '0-1', '0.5-0.5', '0-0')),
          pairing_weight numeric,
          pairing_snapshot jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          completed_at timestamptz,
          primary key (username, table_id, game_id),
          foreign key (username, table_id)
            references ongoing_tables(username, table_id)
            on delete cascade,
          check (
            (result is null and completed_at is null)
            or
            (result is not null and completed_at is not null)
          )
        )
      `
      await sql`
        create index if not exists ongoing_table_games_table_idx
        on ongoing_table_games (username, table_id, created_at desc)
      `
      await sql`
        create index if not exists ongoing_table_games_white_player_idx
        on ongoing_table_games (white_library_player_id)
      `
      await sql`
        create index if not exists ongoing_table_games_black_player_idx
        on ongoing_table_games (black_library_player_id)
      `
    })()
  }

  await ensureRatingSchemaPromise
}

export async function syncTournamentRatingSourcesFromProjection(
  username: AllowedUsername,
): Promise<void> {
  await ensureRatingSchema()

  await sql`
    insert into rated_games (
      username,
      source_type,
      source_id,
      source_game_id,
      white_library_player_id,
      black_library_player_id,
      result,
      played_at,
      source_order,
      updated_at
    )
    select
      tme.username,
      'tournament',
      tme.tournament_id,
      tme.match_id,
      tme.white_library_player_id,
      tme.black_library_player_id,
      tme.result,
      tr.created_at,
      tme.round * 1000 + tme.board,
      now()
    from tournament_match_entries tme
    join tournament_records tr
      on tr.username = tme.username
      and tr.tournament_id = tme.tournament_id
    where tme.username = ${username}
      and tme.is_bye = false
      and tme.white_library_player_id is not null
      and tme.black_library_player_id is not null
      and tme.result in ('1-0', '0-1', '0.5-0.5')
    on conflict (username, source_type, source_id, source_game_id)
    do update set
      white_library_player_id = excluded.white_library_player_id,
      black_library_player_id = excluded.black_library_player_id,
      result = excluded.result,
      played_at = excluded.played_at,
      source_order = excluded.source_order,
      updated_at = now()
  `

  await sql`
    delete from rated_games rg
    where rg.username = ${username}
      and rg.source_type = 'tournament'
      and not exists (
        select 1
        from tournament_match_entries tme
        where tme.username = rg.username
          and tme.tournament_id = rg.source_id
          and tme.match_id = rg.source_game_id
          and tme.is_bye = false
          and tme.white_library_player_id is not null
          and tme.black_library_player_id is not null
          and tme.result in ('1-0', '0-1', '0.5-0.5')
      )
  `
}

export async function upsertOngoingTableRatingSource(params: {
  username: AllowedUsername
  tableId: string
  gameId: string
}): Promise<void> {
  await ensureRatingSchema()

  const rows = (await sql`
    select
      username,
      table_id,
      game_id,
      white_library_player_id,
      black_library_player_id,
      result,
      completed_at
    from ongoing_table_games
    where username = ${params.username}
      and table_id = ${params.tableId}
      and game_id = ${params.gameId}
    limit 1
  `) as Array<{
    white_library_player_id: string
    black_library_player_id: string
    result: string | null
    completed_at: string | null
  }>

  const game = rows[0]

  if (!game || !isRatedResult(game.result) || !game.completed_at) {
    await sql`
      delete from rated_games
      where username = ${params.username}
        and source_type = 'ongoing_table'
        and source_id = ${params.tableId}
        and source_game_id = ${params.gameId}
    `
    return
  }

  await sql`
    insert into rated_games (
      username,
      source_type,
      source_id,
      source_game_id,
      white_library_player_id,
      black_library_player_id,
      result,
      played_at,
      source_order,
      updated_at
    )
    values (
      ${params.username},
      'ongoing_table',
      ${params.tableId},
      ${params.gameId},
      ${game.white_library_player_id},
      ${game.black_library_player_id},
      ${game.result},
      ${game.completed_at},
      0,
      now()
    )
    on conflict (username, source_type, source_id, source_game_id)
    do update set
      white_library_player_id = excluded.white_library_player_id,
      black_library_player_id = excluded.black_library_player_id,
      result = excluded.result,
      played_at = excluded.played_at,
      source_order = excluded.source_order,
      updated_at = now()
  `
}

export async function recalculateUserRatings(username: AllowedUsername): Promise<void> {
  await ensureRatingSchema()

  const libraryRows = (await sql`
    select id
    from player_library
    where username = ${username}
    order by created_at asc, id asc
  `) as LibraryRatingRow[]
  const ratingMap = new Map<string, { rating: number; games: number }>(
    libraryRows.map((row) => [row.id, { rating: DEFAULT_INTERNAL_RATING, games: 0 }]),
  )
  const ratedGames = (await sql`
    select
      source_type,
      source_id,
      source_game_id,
      white_library_player_id,
      black_library_player_id,
      result,
      played_at
    from rated_games
    where username = ${username}
    order by played_at asc, source_order asc, source_type asc, source_id asc, source_game_id asc
  `) as RatedGameRow[]

  await sql`delete from rating_events where username = ${username}`

  let sequenceNumber = 1

  for (const game of ratedGames) {
    const white = ratingMap.get(game.white_library_player_id)
    const black = ratingMap.get(game.black_library_player_id)

    if (!white || !black) {
      continue
    }

    const update = calculateRatingUpdate({
      whiteRating: white.rating,
      blackRating: black.rating,
      whiteGames: white.games,
      blackGames: black.games,
      result: game.result,
    })
    const eventId = [
      username,
      game.source_type,
      game.source_id,
      game.source_game_id,
    ].join(':')

    await sql`
      insert into rating_events (
        id,
        username,
        sequence_number,
        source_type,
        source_id,
        source_game_id,
        white_library_player_id,
        black_library_player_id,
        result,
        white_rating_before,
        black_rating_before,
        white_rating_after,
        black_rating_after,
        white_delta,
        black_delta,
        k_white,
        k_black,
        played_at
      )
      values (
        ${eventId},
        ${username},
        ${sequenceNumber},
        ${game.source_type},
        ${game.source_id},
        ${game.source_game_id},
        ${game.white_library_player_id},
        ${game.black_library_player_id},
        ${game.result},
        ${update.whiteRatingBefore},
        ${update.blackRatingBefore},
        ${update.whiteRatingAfter},
        ${update.blackRatingAfter},
        ${update.whiteDelta},
        ${update.blackDelta},
        ${update.kWhite},
        ${update.kBlack},
        ${game.played_at}
      )
    `

    white.rating = update.whiteRatingAfter
    black.rating = update.blackRatingAfter
    white.games += 1
    black.games += 1
    sequenceNumber += 1
  }

  await sql`delete from player_ratings where username = ${username}`

  for (const row of libraryRows) {
    const rating = ratingMap.get(row.id) ?? {
      rating: DEFAULT_INTERNAL_RATING,
      games: 0,
    }

    await sql`
      insert into player_ratings (
        username,
        library_player_id,
        rating,
        games,
        provisional,
        updated_at
      )
      values (
        ${username},
        ${row.id},
        ${rating.rating},
        ${rating.games},
        ${rating.games < PROVISIONAL_GAME_LIMIT},
        now()
      )
    `
  }
}

export async function listPlayerRatings(username: AllowedUsername): Promise<PlayerRating[]> {
  await ensureRatingSchema()

  const rows = (await sql`
    select
      pl.id as library_player_id,
      coalesce(pr.rating, 1200)::int as rating,
      coalesce(pr.games, 0)::int as games,
      coalesce(pr.provisional, true) as provisional,
      pr.updated_at
    from player_library pl
    left join player_ratings pr
      on pr.username = pl.username
      and pr.library_player_id = pl.id
    where pl.username = ${username}
    order by rating desc, pl.id asc
  `) as Array<{
    library_player_id: string
    rating: number
    games: number
    provisional: boolean
    updated_at: string | null
  }>

  return rows.map((row) => ({
    playerId: row.library_player_id,
    rating: row.rating,
    games: row.games,
    provisional: row.provisional,
    updatedAt: row.updated_at,
  }))
}

export async function listPlayerRatingEvents(
  username: AllowedUsername,
  playerId?: string,
): Promise<RatingEvent[]> {
  await ensureRatingSchema()

  const rows = (await (playerId
    ? sql`
        select *
        from rating_events
        where username = ${username}
          and (
            white_library_player_id = ${playerId}
            or black_library_player_id = ${playerId}
          )
        order by sequence_number asc
      `
    : sql`
        select *
        from rating_events
        where username = ${username}
        order by sequence_number asc
      `)) as Array<{
    id: string
    sequence_number: number
    source_type: RatingSourceType
    source_id: string
    source_game_id: string
    white_library_player_id: string
    black_library_player_id: string
    result: RatedResult
    white_rating_before: number
    black_rating_before: number
    white_rating_after: number
    black_rating_after: number
    white_delta: number
    black_delta: number
    k_white: number
    k_black: number
    played_at: string
    created_at: string
  }>

  return rows.map((row) => ({
    id: row.id,
    sequenceNumber: row.sequence_number,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceGameId: row.source_game_id,
    whitePlayerId: row.white_library_player_id,
    blackPlayerId: row.black_library_player_id,
    result: row.result,
    whiteRatingBefore: row.white_rating_before,
    blackRatingBefore: row.black_rating_before,
    whiteRatingAfter: row.white_rating_after,
    blackRatingAfter: row.black_rating_after,
    whiteDelta: row.white_delta,
    blackDelta: row.black_delta,
    kWhite: row.k_white,
    kBlack: row.k_black,
    playedAt: row.played_at,
    createdAt: row.created_at,
  }))
}
