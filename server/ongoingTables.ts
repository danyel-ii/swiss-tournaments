import { sql } from './db.js'
import type { AllowedUsername } from './config.js'
import {
  ensureRatingSchema,
  recalculateUserRatings,
  upsertOngoingTableRatingSource,
} from './ratings.js'
import {
  DEFAULT_ONGOING_TABLE_SETTINGS,
  buildOngoingPairingCandidates,
  selectWeightedPairing,
  selectWeightedPairingBatch,
  type OngoingPairingPlayerInput,
} from '../src/core/ongoingPairing.js'
import type { ManualMatchResult } from '../src/types/tournament.js'
import type {
  OngoingPairingCandidate,
  OngoingTableDetail,
  OngoingTableGame,
  OngoingTablePlayer,
  OngoingTableSettings,
  OngoingTableSummary,
  OngoingTableStatus,
} from '../src/types/ongoingTable.js'

interface TableRow {
  table_id: string
  name: string
  status: OngoingTableStatus
  settings: Partial<OngoingTableSettings> | null
  created_at: string
  updated_at: string
}

interface TablePlayerRow {
  library_player_id: string
  name_snapshot: string
  active: boolean
  rating: number | null
  rating_games: number | null
  provisional: boolean | null
}

interface TableGameRow {
  game_id: string
  table_id: string
  white_library_player_id: string
  white_name: string | null
  black_library_player_id: string
  black_name: string | null
  result: ManualMatchResult | null
  pairing_weight: string | number | null
  created_at: string
  completed_at: string | null
}

export async function ensureOngoingTableSchema(): Promise<void> {
  await ensureRatingSchema()
}

function normalizeSettings(settings: Partial<OngoingTableSettings> | null | undefined): OngoingTableSettings {
  const merged = {
    ...DEFAULT_ONGOING_TABLE_SETTINGS,
    ...(settings ?? {}),
  }

  return {
    eloTau: Number.isFinite(merged.eloTau) && merged.eloTau > 0 ? merged.eloTau : DEFAULT_ONGOING_TABLE_SETTINGS.eloTau,
    roundRobinGamma:
      Number.isFinite(merged.roundRobinGamma) && merged.roundRobinGamma >= 0
        ? merged.roundRobinGamma
        : DEFAULT_ONGOING_TABLE_SETTINGS.roundRobinGamma,
    epsilon:
      Number.isFinite(merged.epsilon) && merged.epsilon > 0
        ? merged.epsilon
        : DEFAULT_ONGOING_TABLE_SETTINGS.epsilon,
    batchPairings: Boolean(merged.batchPairings),
  }
}

function scoreGame(
  playerId: string,
  game: TableGameRow,
): { score: number; win: number; draw: number; loss: number; games: number } {
  if (!game.result) {
    return { score: 0, win: 0, draw: 0, loss: 0, games: 0 }
  }

  const isWhite = game.white_library_player_id === playerId
  const isBlack = game.black_library_player_id === playerId

  if (!isWhite && !isBlack) {
    return { score: 0, win: 0, draw: 0, loss: 0, games: 0 }
  }

  if (game.result === '0-0') {
    return { score: 0, win: 0, draw: 0, loss: 0, games: 1 }
  }

  if (game.result === '0.5-0.5') {
    return { score: 0.5, win: 0, draw: 1, loss: 0, games: 1 }
  }

  const won = (game.result === '1-0' && isWhite) || (game.result === '0-1' && isBlack)

  return {
    score: won ? 1 : 0,
    win: won ? 1 : 0,
    draw: 0,
    loss: won ? 0 : 1,
    games: 1,
  }
}

function mapGame(row: TableGameRow): OngoingTableGame {
  return {
    id: row.game_id,
    tableId: row.table_id,
    whitePlayerId: row.white_library_player_id,
    whiteName: row.white_name ?? 'Unknown',
    blackPlayerId: row.black_library_player_id,
    blackName: row.black_name ?? 'Unknown',
    result: row.result,
    pairingWeight: row.pairing_weight === null ? null : Number(row.pairing_weight),
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

export async function listOngoingTables(username: AllowedUsername): Promise<OngoingTableSummary[]> {
  await ensureOngoingTableSchema()

  const rows = (await sql`
    select
      ot.table_id,
      ot.name,
      ot.status,
      ot.created_at,
      ot.updated_at,
      count(distinct otp.library_player_id) filter (where otp.active)::int as player_count,
      count(distinct otg.game_id) filter (where otg.result is not null)::int as completed_games
    from ongoing_tables ot
    left join ongoing_table_players otp
      on otp.username = ot.username
      and otp.table_id = ot.table_id
    left join ongoing_table_games otg
      on otg.username = ot.username
      and otg.table_id = ot.table_id
    where ot.username = ${username}
    group by ot.table_id, ot.name, ot.status, ot.created_at, ot.updated_at
    order by ot.updated_at desc
  `) as Array<{
    table_id: string
    name: string
    status: OngoingTableStatus
    player_count: number
    completed_games: number
    created_at: string
    updated_at: string
  }>

  return rows.map((row) => ({
    id: row.table_id,
    name: row.name,
    status: row.status,
    playerCount: row.player_count,
    completedGames: row.completed_games,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getOngoingTableDetail(
  username: AllowedUsername,
  tableId: string,
): Promise<OngoingTableDetail | null> {
  await ensureOngoingTableSchema()

  const tableRows = (await sql`
    select table_id, name, status, settings, created_at, updated_at
    from ongoing_tables
    where username = ${username}
      and table_id = ${tableId}
    limit 1
  `) as TableRow[]
  const table = tableRows[0]

  if (!table) {
    return null
  }

  const [playerRows, gameRows] = await Promise.all([
    sql`
      select
        otp.library_player_id,
        otp.name_snapshot,
        otp.active,
        coalesce(pr.rating, 1200)::int as rating,
        coalesce(pr.games, 0)::int as rating_games,
        coalesce(pr.provisional, true) as provisional
      from ongoing_table_players otp
      left join player_ratings pr
        on pr.username = otp.username
        and pr.library_player_id = otp.library_player_id
      where otp.username = ${username}
        and otp.table_id = ${tableId}
      order by otp.active desc, otp.name_snapshot asc
    `,
    sql`
      select
        otg.game_id,
        otg.table_id,
        otg.white_library_player_id,
        white_player.name_snapshot as white_name,
        otg.black_library_player_id,
        black_player.name_snapshot as black_name,
        otg.result,
        otg.pairing_weight,
        otg.created_at,
        otg.completed_at
      from ongoing_table_games otg
      left join ongoing_table_players white_player
        on white_player.username = otg.username
        and white_player.table_id = otg.table_id
        and white_player.library_player_id = otg.white_library_player_id
      left join ongoing_table_players black_player
        on black_player.username = otg.username
        and black_player.table_id = otg.table_id
        and black_player.library_player_id = otg.black_library_player_id
      where otg.username = ${username}
        and otg.table_id = ${tableId}
      order by otg.created_at desc
    `,
  ])
  const games = gameRows as TableGameRow[]
  const players = (playerRows as TablePlayerRow[]).map((player): OngoingTablePlayer => {
    const relevantGames = games.filter(
      (game) =>
        game.white_library_player_id === player.library_player_id ||
        game.black_library_player_id === player.library_player_id,
    )
    const totals = relevantGames.reduce(
      (current, game) => {
        const score = scoreGame(player.library_player_id, game)

        return {
          tableScore: current.tableScore + score.score,
          tableGames: current.tableGames + score.games,
          wins: current.wins + score.win,
          draws: current.draws + score.draw,
          losses: current.losses + score.loss,
          whiteGames:
            current.whiteGames + (game.white_library_player_id === player.library_player_id ? 1 : 0),
          blackGames:
            current.blackGames + (game.black_library_player_id === player.library_player_id ? 1 : 0),
        }
      },
      { tableScore: 0, tableGames: 0, wins: 0, draws: 0, losses: 0, whiteGames: 0, blackGames: 0 },
    )

    return {
      playerId: player.library_player_id,
      name: player.name_snapshot,
      active: player.active,
      rating: player.rating ?? 1200,
      ratingGames: player.rating_games ?? 0,
      provisional: player.provisional ?? true,
      ...totals,
    }
  })

  return {
    id: table.table_id,
    name: table.name,
    status: table.status,
    settings: normalizeSettings(table.settings),
    createdAt: table.created_at,
    updatedAt: table.updated_at,
    players: players.sort((left, right) => {
      if (left.tableScore !== right.tableScore) {
        return right.tableScore - left.tableScore
      }

      return left.name.localeCompare(right.name)
    }),
    games: games.map(mapGame),
  }
}

export async function createOngoingTable(params: {
  username: AllowedUsername
  name: string
  playerIds: string[]
  settings?: Partial<OngoingTableSettings>
}): Promise<OngoingTableDetail> {
  await ensureOngoingTableSchema()

  const name = params.name.trim()
  const playerIds = [...new Set(params.playerIds)]

  if (!name) {
    throw new Error('Table name is required')
  }

  if (playerIds.length < 2) {
    throw new Error('At least two players are required')
  }

  const players = (await sql`
    select id, display_name
    from player_library
    where username = ${params.username}
      and hidden = false
      and id = any(${playerIds})
  `) as Array<{ id: string; display_name: string }>

  if (players.length !== playerIds.length) {
    throw new Error('One or more players were not found')
  }

  const tableId = crypto.randomUUID()
  const settings = normalizeSettings(params.settings)

  await sql`
    insert into ongoing_tables (username, table_id, name, settings)
    values (${params.username}, ${tableId}, ${name}, ${JSON.stringify(settings)}::jsonb)
  `

  for (const player of players) {
    await sql`
      insert into ongoing_table_players (
        username,
        table_id,
        library_player_id,
        name_snapshot,
        active
      )
      values (${params.username}, ${tableId}, ${player.id}, ${player.display_name}, true)
    `
  }

  return (await getOngoingTableDetail(params.username, tableId)) as OngoingTableDetail
}

export async function updateOngoingTablePlayers(params: {
  username: AllowedUsername
  tableId: string
  name?: string
  settings?: Partial<OngoingTableSettings>
  addPlayerIds?: string[]
  removePlayerIds?: string[]
}): Promise<OngoingTableDetail | null> {
  await ensureOngoingTableSchema()

  const detail = await getOngoingTableDetail(params.username, params.tableId)

  if (!detail) {
    return null
  }

  if (params.name !== undefined) {
    const name = params.name.trim()

    if (!name) {
      throw new Error('Table name is required')
    }

    await sql`
      update ongoing_tables
      set name = ${name}, updated_at = now()
      where username = ${params.username}
        and table_id = ${params.tableId}
    `
  }

  if (params.settings) {
    await sql`
      update ongoing_tables
      set settings = ${JSON.stringify(normalizeSettings({ ...detail.settings, ...params.settings }))}::jsonb,
          updated_at = now()
      where username = ${params.username}
        and table_id = ${params.tableId}
    `
  }

  const addPlayerIds = [...new Set(params.addPlayerIds ?? [])]
  const removePlayerIds = [...new Set(params.removePlayerIds ?? [])]

  if (addPlayerIds.length > 0) {
    const players = (await sql`
      select id, display_name
      from player_library
      where username = ${params.username}
        and hidden = false
        and id = any(${addPlayerIds})
    `) as Array<{ id: string; display_name: string }>

    for (const player of players) {
      await sql`
        insert into ongoing_table_players (
          username,
          table_id,
          library_player_id,
          name_snapshot,
          active,
          removed_at
        )
        values (${params.username}, ${params.tableId}, ${player.id}, ${player.display_name}, true, null)
        on conflict (username, table_id, library_player_id)
        do update set active = true, removed_at = null, name_snapshot = excluded.name_snapshot
      `
    }
  }

  for (const playerId of removePlayerIds) {
    await sql`
      update ongoing_table_players
      set active = false, removed_at = now()
      where username = ${params.username}
        and table_id = ${params.tableId}
        and library_player_id = ${playerId}
    `
  }

  const activeRows = (await sql`
    select count(*)::int as active_count
    from ongoing_table_players
    where username = ${params.username}
      and table_id = ${params.tableId}
      and active
  `) as Array<{ active_count: number }>

  if ((activeRows[0]?.active_count ?? 0) < 2) {
    throw new Error('At least two active players are required')
  }

  return getOngoingTableDetail(params.username, params.tableId)
}

export async function suggestOngoingPairing(params: {
  username: AllowedUsername
  tableId: string
  batch?: boolean
}): Promise<OngoingPairingCandidate[]> {
  const detail = await getOngoingTableDetail(params.username, params.tableId)

  if (!detail) {
    return []
  }

  const players: OngoingPairingPlayerInput[] = detail.players
    .filter((player) => player.active)
    .map((player) => ({
      playerId: player.playerId,
      name: player.name,
      rating: player.rating,
      tableGames: player.tableGames,
      whiteGames: player.whiteGames,
      blackGames: player.blackGames,
    }))
  const games = detail.games.map((game) => ({
    whitePlayerId: game.whitePlayerId,
    blackPlayerId: game.blackPlayerId,
    result: game.result,
    completedAt: game.completedAt,
    createdAt: game.createdAt,
  }))
  const candidates = params.batch || detail.settings.batchPairings
    ? selectWeightedPairingBatch({ players, games, settings: detail.settings })
    : [
        selectWeightedPairing(
          buildOngoingPairingCandidates({ players, games, settings: detail.settings }),
        ),
      ].filter((candidate): candidate is OngoingPairingCandidate => candidate !== null)

  return candidates
}

export async function createOngoingTableGame(params: {
  username: AllowedUsername
  tableId: string
  whitePlayerId: string
  blackPlayerId: string
  pairingWeight?: number | null
  pairingSnapshot?: unknown
}): Promise<OngoingTableGame> {
  await ensureOngoingTableSchema()

  if (params.whitePlayerId === params.blackPlayerId) {
    throw new Error('Players must be different')
  }

  const members = (await sql`
    select library_player_id
    from ongoing_table_players
    where username = ${params.username}
      and table_id = ${params.tableId}
      and active
      and library_player_id = any(${[params.whitePlayerId, params.blackPlayerId]})
  `) as Array<{ library_player_id: string }>

  if (members.length !== 2) {
    throw new Error('Both players must be active table members')
  }

  const gameId = crypto.randomUUID()

  await sql`
    insert into ongoing_table_games (
      username,
      table_id,
      game_id,
      white_library_player_id,
      black_library_player_id,
      pairing_weight,
      pairing_snapshot
    )
    values (
      ${params.username},
      ${params.tableId},
      ${gameId},
      ${params.whitePlayerId},
      ${params.blackPlayerId},
      ${params.pairingWeight ?? null},
      ${JSON.stringify(params.pairingSnapshot ?? {})}::jsonb
    )
  `
  await sql`
    update ongoing_tables
    set updated_at = now()
    where username = ${params.username}
      and table_id = ${params.tableId}
  `

  const detail = await getOngoingTableDetail(params.username, params.tableId)
  const game = detail?.games.find((entry) => entry.id === gameId)

  if (!game) {
    throw new Error('Unable to create game')
  }

  return game
}

export async function setOngoingTableGameResult(params: {
  username: AllowedUsername
  tableId: string
  gameId: string
  result: ManualMatchResult
}): Promise<OngoingTableDetail | null> {
  await ensureOngoingTableSchema()

  const existing = (await sql`
    select completed_at
    from ongoing_table_games
    where username = ${params.username}
      and table_id = ${params.tableId}
      and game_id = ${params.gameId}
    limit 1
  `) as Array<{ completed_at: string | null }>

  if (!existing[0]) {
    return null
  }

  await sql`
    update ongoing_table_games
    set result = ${params.result},
        completed_at = coalesce(completed_at, now())
    where username = ${params.username}
      and table_id = ${params.tableId}
      and game_id = ${params.gameId}
  `
  await sql`
    update ongoing_tables
    set updated_at = now()
    where username = ${params.username}
      and table_id = ${params.tableId}
  `
  await upsertOngoingTableRatingSource(params)
  await recalculateUserRatings(params.username)

  return getOngoingTableDetail(params.username, params.tableId)
}

export async function archiveOngoingTable(
  username: AllowedUsername,
  tableId: string,
): Promise<boolean> {
  await ensureOngoingTableSchema()

  const rows = (await sql`
    update ongoing_tables
    set status = 'archived', updated_at = now()
    where username = ${username}
      and table_id = ${tableId}
    returning table_id
  `) as Array<{ table_id: string }>

  return rows.length > 0
}

export async function deleteOngoingTable(
  username: AllowedUsername,
  tableId: string,
): Promise<boolean> {
  await ensureOngoingTableSchema()

  const rows = (await sql`
    delete from ongoing_tables
    where username = ${username}
      and table_id = ${tableId}
    returning table_id
  `) as Array<{ table_id: string }>

  // Preserve canonical rated game sources so Magie-Punkte remain historical
  // even when the table UI/history is deleted.
  await recalculateUserRatings(username)

  return rows.length > 0
}
