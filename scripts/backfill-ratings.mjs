import { neon } from '@neondatabase/serverless'

const ALLOWED_USERNAMES = ['kusselberg', 'schachmagie', 'danyel-ii']
const DEFAULT_INTERNAL_RATING = 1200
const PROVISIONAL_GAME_LIMIT = 20
const PROVISIONAL_K = 40
const DEFAULT_K = 32

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

const sql = neon(process.env.DATABASE_URL)

function getExpectedScore(playerRating, opponentRating) {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
}

function getKFactor(gamesPlayed) {
  return gamesPlayed < PROVISIONAL_GAME_LIMIT ? PROVISIONAL_K : DEFAULT_K
}

function actualScores(result) {
  if (result === '1-0') {
    return { white: 1, black: 0 }
  }

  if (result === '0-1') {
    return { white: 0, black: 1 }
  }

  return { white: 0.5, black: 0.5 }
}

async function ensureSchema() {
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
}

async function syncTournamentSources(username) {
  await sql`
    insert into rated_games (
      username, source_type, source_id, source_game_id,
      white_library_player_id, black_library_player_id, result, played_at, source_order, updated_at
    )
    select
      tme.username, 'tournament', tme.tournament_id, tme.match_id,
      tme.white_library_player_id, tme.black_library_player_id, tme.result,
      tr.created_at, tme.round * 1000 + tme.board, now()
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
}

async function recalculate(username) {
  const libraryRows = await sql`
    select id
    from player_library
    where username = ${username}
    order by created_at asc, id asc
  `
  const ratingMap = new Map(
    libraryRows.map((row) => [row.id, { rating: DEFAULT_INTERNAL_RATING, games: 0 }]),
  )
  const games = await sql`
    select *
    from rated_games
    where username = ${username}
    order by played_at asc, source_order asc, source_type asc, source_id asc, source_game_id asc
  `

  await sql`delete from rating_events where username = ${username}`
  let sequence = 1

  for (const game of games) {
    const white = ratingMap.get(game.white_library_player_id)
    const black = ratingMap.get(game.black_library_player_id)

    if (!white || !black) {
      continue
    }

    const actual = actualScores(game.result)
    const expectedWhite = getExpectedScore(white.rating, black.rating)
    const expectedBlack = 1 - expectedWhite
    const kWhite = getKFactor(white.games)
    const kBlack = getKFactor(black.games)
    const whiteDelta = Math.round(kWhite * (actual.white - expectedWhite))
    const blackDelta = Math.round(kBlack * (actual.black - expectedBlack))
    const whiteBefore = white.rating
    const blackBefore = black.rating

    white.rating += whiteDelta
    black.rating += blackDelta
    white.games += 1
    black.games += 1

    await sql`
      insert into rating_events (
        id, username, sequence_number, source_type, source_id, source_game_id,
        white_library_player_id, black_library_player_id, result,
        white_rating_before, black_rating_before, white_rating_after, black_rating_after,
        white_delta, black_delta, k_white, k_black, played_at
      )
      values (
        ${[username, game.source_type, game.source_id, game.source_game_id].join(':')},
        ${username}, ${sequence}, ${game.source_type}, ${game.source_id}, ${game.source_game_id},
        ${game.white_library_player_id}, ${game.black_library_player_id}, ${game.result},
        ${whiteBefore}, ${blackBefore}, ${white.rating}, ${black.rating},
        ${whiteDelta}, ${blackDelta}, ${kWhite}, ${kBlack}, ${game.played_at}
      )
    `
    sequence += 1
  }

  await sql`delete from player_ratings where username = ${username}`

  for (const row of libraryRows) {
    const rating = ratingMap.get(row.id) ?? { rating: DEFAULT_INTERNAL_RATING, games: 0 }

    await sql`
      insert into player_ratings (username, library_player_id, rating, games, provisional, updated_at)
      values (${username}, ${row.id}, ${rating.rating}, ${rating.games}, ${rating.games < PROVISIONAL_GAME_LIMIT}, now())
    `
  }
}

await ensureSchema()

for (const username of ALLOWED_USERNAMES) {
  await syncTournamentSources(username)
  await recalculate(username)
  console.log(`Backfilled ratings for ${username}`)
}
