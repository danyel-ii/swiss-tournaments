import { sql } from './db.js'
import type { AllowedUsername } from './config.js'
import type {
  LibraryPlayer,
  PlayerStatsDetail,
  PlayerStatsSummary,
  PlayerTournamentStat,
} from '../src/types/library.js'
import type { TournamentCollection } from '../src/types/workspace.js'

interface LibraryRow {
  id: string
  display_name: string
  created_at: string
}

interface TournamentPlayerProjectionRow {
  library_player_id: string | null
  tournament_id: string
  name_snapshot: string
}

interface MatchProjectionRow {
  tournament_id: string
  white_library_player_id: string | null
  black_library_player_id: string | null
  result: string | null
  is_bye: boolean
}

interface TournamentRecordRow {
  tournament_id: string
  name: string
  updated_at: string
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

async function ensureLibraryPlayer(
  username: AllowedUsername,
  name: string,
  libraryPlayerId: string | null,
): Promise<LibraryRow> {
  const normalizedName = normalizeName(name)

  if (libraryPlayerId) {
    const byId = (await sql`
      insert into player_library (id, username, normalized_name, display_name)
      values (${libraryPlayerId}, ${username}, ${normalizedName}, ${name})
      on conflict (id)
      do update set normalized_name = excluded.normalized_name, display_name = excluded.display_name
      returning id, display_name, created_at
    `) as LibraryRow[]

    return byId[0]
  }

  const byName = (await sql`
    insert into player_library (id, username, normalized_name, display_name)
    values (${crypto.randomUUID()}, ${username}, ${normalizedName}, ${name})
    on conflict (username, normalized_name)
    do update set display_name = excluded.display_name
    returning id, display_name, created_at
  `) as LibraryRow[]

  return byName[0]
}

export async function syncWorkspaceProjection(
  username: AllowedUsername,
  collection: TournamentCollection,
): Promise<void> {
  for (const tournament of collection.tournaments) {
    const libraryIdByTournamentPlayerId = new Map<string, string>()

    await sql`
      delete from tournament_match_entries
      where username = ${username}
        and tournament_id = ${tournament.id}
    `
    await sql`
      delete from tournament_player_entries
      where username = ${username}
        and tournament_id = ${tournament.id}
    `
    await sql`
      delete from tournament_records
      where username = ${username}
        and tournament_id = ${tournament.id}
    `

    await sql`
      insert into tournament_records (
        tournament_id,
        username,
        name,
        status,
        total_rounds,
        current_round,
        created_at,
        updated_at
      )
      values (
        ${tournament.id},
        ${username},
        ${tournament.name},
        ${tournament.status},
        ${tournament.totalRounds},
        ${tournament.currentRound},
        ${tournament.createdAt},
        ${tournament.updatedAt}
      )
    `

    for (const player of tournament.players) {
      const libraryPlayer = await ensureLibraryPlayer(
        username,
        player.name,
        player.libraryPlayerId,
      )
      libraryIdByTournamentPlayerId.set(player.id, libraryPlayer.id)

      await sql`
        insert into tournament_player_entries (
          tournament_id,
          username,
          tournament_player_id,
          library_player_id,
          name_snapshot,
          seed,
          entered_round,
          dropped_after_round
        )
        values (
          ${tournament.id},
          ${username},
          ${player.id},
          ${libraryPlayer.id},
          ${player.name},
          ${player.seed},
          ${player.enteredRound},
          ${player.droppedAfterRound}
        )
      `
    }

    for (const match of tournament.matches) {
      await sql`
        insert into tournament_match_entries (
          tournament_id,
          username,
          match_id,
          round,
          board,
          white_tournament_player_id,
          black_tournament_player_id,
          white_library_player_id,
          black_library_player_id,
          result,
          is_bye
        )
        values (
          ${tournament.id},
          ${username},
          ${match.id},
          ${match.round},
          ${match.board},
          ${match.whitePlayerId},
          ${match.blackPlayerId},
          ${libraryIdByTournamentPlayerId.get(match.whitePlayerId) ?? null},
          ${match.blackPlayerId ? libraryIdByTournamentPlayerId.get(match.blackPlayerId) ?? null : null},
          ${match.result},
          ${match.isBye}
        )
      `
    }
  }
}

export async function listLibraryPlayers(username: AllowedUsername): Promise<LibraryPlayer[]> {
  const rows = (await sql`
    select
      pl.id,
      pl.display_name as name,
      pl.created_at,
      count(distinct tpe.tournament_id)::int as tournament_count
    from player_library pl
    left join tournament_player_entries tpe
      on tpe.library_player_id = pl.id
    where pl.username = ${username}
    group by pl.id, pl.display_name, pl.created_at
    order by pl.display_name asc
  `) as Array<{
    id: string
    name: string
    created_at: string
    tournament_count: number
  }>

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    tournamentCount: row.tournament_count,
    createdAt: row.created_at,
  }))
}

function createEmptySummary(row: LibraryRow): PlayerStatsSummary {
  return {
    playerId: row.id,
    name: row.display_name,
    tournamentsPlayed: 0,
    gamesPlayed: 0,
    totalScore: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    byes: 0,
    lastPlayedAt: null,
  }
}

function applyMatchToSummary(summary: PlayerStatsSummary, match: MatchProjectionRow): void {
  if (match.is_bye) {
    if (match.white_library_player_id === summary.playerId && match.result === 'BYE') {
      summary.byes += 1
      summary.totalScore += 1
    }
    return
  }

  if (match.result === null) {
    return
  }

  const isWhite = match.white_library_player_id === summary.playerId
  const isBlack = match.black_library_player_id === summary.playerId

  if (!isWhite && !isBlack) {
    return
  }

  summary.gamesPlayed += 1

  switch (match.result) {
    case '1-0':
      if (isWhite) {
        summary.wins += 1
        summary.totalScore += 1
      } else {
        summary.losses += 1
      }
      break
    case '0-1':
      if (isBlack) {
        summary.wins += 1
        summary.totalScore += 1
      } else {
        summary.losses += 1
      }
      break
    case '0.5-0.5':
      summary.draws += 1
      summary.totalScore += 0.5
      break
    case '0-0':
      break
    default:
      break
  }
}

export async function listPlayerStats(
  username: AllowedUsername,
): Promise<PlayerStatsSummary[]> {
  const libraryRows = (await sql`
    select id, display_name, created_at
    from player_library
    where username = ${username}
    order by display_name asc
  `) as LibraryRow[]
  const playerRows = (await sql`
    select library_player_id, tournament_id, name_snapshot
    from tournament_player_entries
    where username = ${username}
  `) as TournamentPlayerProjectionRow[]
  const matchRows = (await sql`
    select tournament_id, white_library_player_id, black_library_player_id, result, is_bye
    from tournament_match_entries
    where username = ${username}
  `) as MatchProjectionRow[]
  const tournamentRows = (await sql`
    select tournament_id, name, updated_at
    from tournament_records
    where username = ${username}
  `) as TournamentRecordRow[]

  const summaries = new Map<string, PlayerStatsSummary>(
    libraryRows.map((row) => [row.id, createEmptySummary(row)]),
  )

  for (const row of playerRows) {
    if (!row.library_player_id) {
      continue
    }

    const summary = summaries.get(row.library_player_id)

    if (!summary) {
      continue
    }

    summary.tournamentsPlayed += 1
  }

  const lastPlayedByPlayerId = new Map<string, string>()
  const tournamentById = new Map(tournamentRows.map((row) => [row.tournament_id, row]))

  for (const match of matchRows) {
    for (const summary of summaries.values()) {
      const beforeScore = summary.totalScore
      const beforeGames = summary.gamesPlayed
      const beforeByes = summary.byes
      applyMatchToSummary(summary, match)

      if (
        summary.totalScore !== beforeScore ||
        summary.gamesPlayed !== beforeGames ||
        summary.byes !== beforeByes
      ) {
        const updatedAt = tournamentById.get(match.tournament_id)?.updated_at

        if (updatedAt) {
          const previous = lastPlayedByPlayerId.get(summary.playerId)
          if (!previous || new Date(updatedAt).getTime() > new Date(previous).getTime()) {
            lastPlayedByPlayerId.set(summary.playerId, updatedAt)
          }
        }
      }
    }
  }

  for (const summary of summaries.values()) {
    summary.lastPlayedAt = lastPlayedByPlayerId.get(summary.playerId) ?? null
  }

  return [...summaries.values()]
    .filter((summary) => summary.tournamentsPlayed > 0)
    .sort((left, right) => {
    if (left.totalScore !== right.totalScore) {
      return right.totalScore - left.totalScore
    }

    return left.name.localeCompare(right.name)
    })
}

export async function getPlayerStatsDetail(
  username: AllowedUsername,
  playerId: string,
): Promise<PlayerStatsDetail | null> {
  const summaries = await listPlayerStats(username)
  const summary = summaries.find((entry) => entry.playerId === playerId)

  if (!summary) {
    return null
  }

  const tournaments = (await sql`
    select tournament_id, name, updated_at
    from tournament_records
    where username = ${username}
    order by updated_at desc
  `) as TournamentRecordRow[]
  const playerEntries = (await sql`
    select tournament_id
    from tournament_player_entries
    where username = ${username}
      and library_player_id = ${playerId}
  `) as Array<{ tournament_id: string }>
  const matchRows = (await sql`
    select tournament_id, white_library_player_id, black_library_player_id, result, is_bye
    from tournament_match_entries
    where username = ${username}
      and (white_library_player_id = ${playerId} or black_library_player_id = ${playerId})
  `) as MatchProjectionRow[]

  const includedTournamentIds = new Set(playerEntries.map((entry) => entry.tournament_id))
  const detailByTournamentId = new Map<string, PlayerTournamentStat>()

  for (const tournament of tournaments) {
    if (!includedTournamentIds.has(tournament.tournament_id)) {
      continue
    }

    detailByTournamentId.set(tournament.tournament_id, {
      tournamentId: tournament.tournament_id,
      tournamentName: tournament.name,
      updatedAt: tournament.updated_at,
      score: 0,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      byes: 0,
    })
  }

  for (const match of matchRows) {
    const detail = detailByTournamentId.get(match.tournament_id)

    if (!detail) {
      continue
    }

    if (match.is_bye) {
      if (match.white_library_player_id === playerId && match.result === 'BYE') {
        detail.byes += 1
        detail.score += 1
      }
      continue
    }

    if (match.result === null) {
      continue
    }

    const isWhite = match.white_library_player_id === playerId
    const isBlack = match.black_library_player_id === playerId

    if (!isWhite && !isBlack) {
      continue
    }

    detail.gamesPlayed += 1

    switch (match.result) {
      case '1-0':
        if (isWhite) {
          detail.wins += 1
          detail.score += 1
        } else {
          detail.losses += 1
        }
        break
      case '0-1':
        if (isBlack) {
          detail.wins += 1
          detail.score += 1
        } else {
          detail.losses += 1
        }
        break
      case '0.5-0.5':
        detail.draws += 1
        detail.score += 0.5
        break
      case '0-0':
        break
      default:
        break
    }
  }

  return {
    summary,
    tournaments: [...detailByTournamentId.values()].sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    ),
  }
}
