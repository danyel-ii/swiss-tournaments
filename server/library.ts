import { sql } from './db.js'
import type { AllowedUsername } from './config.js'
import {
  getMatchPointsForPlayer,
  getPlayerColorHistory,
  getPlayersEnteredByRound,
  getPlayerStats,
} from '../src/core/ranking.js'
import type {
  HeadToHeadDetail,
  HeadToHeadMatch,
  HeadToHeadTournament,
  LibraryPlayer,
  PlayerByeHistoryItem,
  PlayerHeadToHeadStat,
  PlayerStatsDetail,
  PlayerStatsSummary,
  PlayerTournamentStat,
  PlayerTournamentOpponentStat,
  PlayerTournamentRoundStat,
} from '../src/types/library.js'
import type { Match, Player, TournamentStatus } from '../src/types/tournament.js'
import type { TournamentCollection } from '../src/types/workspace.js'

interface LibraryRow {
  id: string
  display_name: string
  created_at: string
}

interface TournamentPlayerProjectionRow {
  tournament_player_id: string
  library_player_id: string | null
  tournament_id: string
  name_snapshot: string
  seed: number
  entered_round: number
  dropped_after_round: number | null
}

interface MatchProjectionRow {
  match_id: string
  tournament_id: string
  round: number
  board: number
  white_tournament_player_id: string
  black_tournament_player_id: string | null
  white_library_player_id: string | null
  black_library_player_id: string | null
  result: string | null
  is_bye: boolean
}

interface TournamentRecordRow {
  tournament_id: string
  name: string
  status: TournamentStatus
  total_rounds: number
  current_round: number
  created_at: string
  updated_at: string
}

interface TournamentSnapshot {
  record: TournamentRecordRow
  players: Player[]
  matches: Match[]
  playerById: Map<string, Player>
}

interface TournamentPlayerAggregate {
  score: number
  gamesPlayed: number
  wins: number
  draws: number
  losses: number
  byes: number
  whiteGames: number
  blackGames: number
}

interface SummaryAccumulator {
  summary: PlayerStatsSummary
  buchholzSamples: Array<{ value: number; updatedAt: string }>
  whiteWins: number
  whiteCompletedGames: number
  blackWins: number
  blackCompletedGames: number
}

interface HeadToHeadContext {
  leftPlayerId: string
  leftPlayerName: string
  rightPlayerId: string
  rightPlayerName: string
}

let ensureLibrarySchemaPromise: Promise<void> | null = null

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

async function ensureLibrarySchema(): Promise<void> {
  if (!ensureLibrarySchemaPromise) {
    ensureLibrarySchemaPromise = (async () => {
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

      await sql`
        alter table player_library
        add column if not exists hidden boolean not null default false
      `
    })()
  }

  await ensureLibrarySchemaPromise
}

async function ensureLibraryPlayer(
  username: AllowedUsername,
  name: string,
  libraryPlayerId: string | null,
): Promise<LibraryRow> {
  await ensureLibrarySchema()
  const normalizedName = normalizeName(name)

  if (libraryPlayerId) {
    const byId = (await sql`
      insert into player_library (id, username, normalized_name, display_name, hidden)
      values (${libraryPlayerId}, ${username}, ${normalizedName}, ${name}, false)
      on conflict (id)
      do update set normalized_name = excluded.normalized_name, display_name = excluded.display_name
      returning id, display_name, created_at
    `) as LibraryRow[]

    return byId[0]
  }

  const byName = (await sql`
    insert into player_library (id, username, normalized_name, display_name, hidden)
    values (${crypto.randomUUID()}, ${username}, ${normalizedName}, ${name}, false)
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
  await ensureLibrarySchema()

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
  await ensureLibrarySchema()

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
      and pl.hidden = false
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

export async function hideLibraryPlayer(
  username: AllowedUsername,
  playerId: string,
): Promise<boolean> {
  await ensureLibrarySchema()

  const result = (await sql`
    update player_library
    set hidden = true
    where username = ${username}
      and id = ${playerId}
      and hidden = false
    returning id
  `) as Array<{ id: string }>

  return result.length > 0
}

function createEmptySummary(row: LibraryRow): PlayerStatsSummary {
  return {
    playerId: row.id,
    name: row.display_name,
    tournamentsPlayed: 0,
    completedTournaments: 0,
    partialTournaments: 0,
    gamesPlayed: 0,
    totalScore: 0,
    scorePercentage: 0,
    wins: 0,
    winRate: 0,
    winRateAsWhite: 0,
    winRateAsBlack: 0,
    draws: 0,
    drawRate: 0,
    losses: 0,
    lossRate: 0,
    byes: 0,
    undefeatedTournaments: 0,
    lateEntries: 0,
    dropouts: 0,
    whiteGames: 0,
    blackGames: 0,
    colorImbalance: 0,
    longestWhiteStreak: 0,
    longestBlackStreak: 0,
    averageBuchholz: 0,
    bestBuchholz: 0,
    latestBuchholz: null,
    lastPlayedAt: null,
  }
}

function createSummaryAccumulator(row: LibraryRow): SummaryAccumulator {
  return {
    summary: createEmptySummary(row),
    buchholzSamples: [],
    whiteWins: 0,
    whiteCompletedGames: 0,
    blackWins: 0,
    blackCompletedGames: 0,
  }
}

function createMatchResultValue(result: string | null): Match['result'] | null {
  if (
    result === '1-0' ||
    result === '0-1' ||
    result === '0.5-0.5' ||
    result === '0-0' ||
    result === 'BYE'
  ) {
    return result
  }

  return null
}

function sortMatchesChronologically(matches: Match[]): Match[] {
  return [...matches].sort((left, right) => {
    if (left.round !== right.round) {
      return left.round - right.round
    }

    return left.board - right.board
  })
}

function computeLongestColorStreak(colorHistory: Array<'W' | 'B'>, targetColor: 'W' | 'B'): number {
  let current = 0
  let best = 0

  for (const color of colorHistory) {
    if (color === targetColor) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }

  return best
}

function createTournamentAggregate(playerId: string, matches: Match[]): TournamentPlayerAggregate {
  const aggregate: TournamentPlayerAggregate = {
    score: 0,
    gamesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    byes: 0,
    whiteGames: 0,
    blackGames: 0,
  }

  for (const match of sortMatchesChronologically(matches)) {
    if (match.isBye) {
      if (match.whitePlayerId === playerId && match.result === 'BYE') {
        aggregate.byes += 1
        aggregate.score += 1
      }
      continue
    }

    const isWhite = match.whitePlayerId === playerId
    const isBlack = match.blackPlayerId === playerId

    if (!isWhite && !isBlack) {
      continue
    }

    if (isWhite) {
      aggregate.whiteGames += 1
    }

    if (isBlack) {
      aggregate.blackGames += 1
    }

    if (match.result === null) {
      continue
    }

    aggregate.gamesPlayed += 1

    switch (match.result) {
      case '1-0':
        if (isWhite) {
          aggregate.wins += 1
          aggregate.score += 1
        } else {
          aggregate.losses += 1
        }
        break
      case '0-1':
        if (isBlack) {
          aggregate.wins += 1
          aggregate.score += 1
        } else {
          aggregate.losses += 1
        }
        break
      case '0.5-0.5':
        aggregate.draws += 1
        aggregate.score += 0.5
        break
      case '0-0':
        break
      default:
        break
    }
  }

  return aggregate
}

function getScorePercentage(score: number, gamesPlayed: number, byes: number): number {
  const denominator = gamesPlayed + byes

  if (denominator === 0) {
    return 0
  }

  return score / denominator
}

function buildTournamentSnapshots(
  tournamentRows: TournamentRecordRow[],
  playerRows: TournamentPlayerProjectionRow[],
  matchRows: MatchProjectionRow[],
): Map<string, TournamentSnapshot> {
  const playersByTournamentId = new Map<string, TournamentPlayerProjectionRow[]>()
  const matchesByTournamentId = new Map<string, MatchProjectionRow[]>()

  for (const row of playerRows) {
    const current = playersByTournamentId.get(row.tournament_id) ?? []
    current.push(row)
    playersByTournamentId.set(row.tournament_id, current)
  }

  for (const row of matchRows) {
    const current = matchesByTournamentId.get(row.tournament_id) ?? []
    current.push(row)
    matchesByTournamentId.set(row.tournament_id, current)
  }

  return new Map(
    tournamentRows.map((record) => {
      const players = (playersByTournamentId.get(record.tournament_id) ?? []).map((row) => ({
        id: row.tournament_player_id,
        libraryPlayerId: row.library_player_id,
        name: row.name_snapshot,
        seed: row.seed,
        enteredRound: row.entered_round,
        droppedAfterRound: row.dropped_after_round,
      }))
      const matches = (matchesByTournamentId.get(record.tournament_id) ?? []).map((row) => ({
        id: row.match_id,
        round: row.round,
        board: row.board,
        whitePlayerId: row.white_tournament_player_id,
        blackPlayerId: row.black_tournament_player_id,
        result: createMatchResultValue(row.result),
        isBye: row.is_bye,
      }))

      return [
        record.tournament_id,
        {
          record,
          players,
          matches,
          playerById: new Map(players.map((player) => [player.id, player])),
        } satisfies TournamentSnapshot,
      ]
    }),
  )
}

function buildTournamentOpponentStats(
  targetPlayerId: string,
  snapshot: TournamentSnapshot,
): PlayerTournamentOpponentStat[] {
  return sortMatchesChronologically(snapshot.matches)
    .filter(
      (match) =>
        match.whitePlayerId === targetPlayerId || match.blackPlayerId === targetPlayerId,
    )
    .map((match) => {
      if (match.isBye) {
        return {
          round: match.round,
          board: match.board,
          opponentPlayerId: null,
          opponentName: 'BYE',
          color: null,
          result: match.result,
          points: getMatchPointsForPlayer(match, targetPlayerId),
        }
      }

      const isWhite = match.whitePlayerId === targetPlayerId
      const opponentId = isWhite ? (match.blackPlayerId as string) : match.whitePlayerId

      return {
        round: match.round,
        board: match.board,
        opponentPlayerId: snapshot.playerById.get(opponentId)?.libraryPlayerId ?? null,
        opponentName: snapshot.playerById.get(opponentId)?.name ?? 'Unknown',
        color: isWhite ? 'W' : 'B',
        result: match.result,
        points: getMatchPointsForPlayer(match, targetPlayerId),
      }
    })
}

function buildRoundProgression(
  targetPlayerId: string,
  snapshot: TournamentSnapshot,
): PlayerTournamentRoundStat[] {
  const currentRound = snapshot.record.current_round
  const progression: PlayerTournamentRoundStat[] = []

  for (let round = 1; round <= currentRound; round += 1) {
    const player = snapshot.playerById.get(targetPlayerId)

    if (!player || player.enteredRound > round) {
      continue
    }

    const playersEnteredByRound = getPlayersEnteredByRound(snapshot.players, round)
    const matchesThroughRound = snapshot.matches.filter((match) => match.round <= round)
    const standing = getPlayerStats(targetPlayerId, playersEnteredByRound, matchesThroughRound)

    progression.push({
      round,
      score: standing.score,
      buchholz: standing.buchholz,
      rank: standing.rank,
    })
  }

  return progression
}

function buildPlayerTournamentStat(
  playerId: string,
  snapshot: TournamentSnapshot,
): PlayerTournamentStat | null {
  const player = snapshot.players.find((entry) => entry.libraryPlayerId === playerId)

  if (!player) {
    return null
  }

  const evaluationRound = Math.max(snapshot.record.current_round, player.enteredRound, 1)
  const standingsPool = getPlayersEnteredByRound(
    snapshot.players,
    evaluationRound,
  )
  const standing = getPlayerStats(player.id, standingsPool, snapshot.matches)
  const aggregate = createTournamentAggregate(player.id, snapshot.matches)
  const colorHistory = getPlayerColorHistory(player.id, snapshot.matches)

  return {
    tournamentId: snapshot.record.tournament_id,
    tournamentName: snapshot.record.name,
    updatedAt: snapshot.record.updated_at,
    status: snapshot.record.status,
    totalRounds: snapshot.record.total_rounds,
    currentRound: snapshot.record.current_round,
    playerCount: standingsPool.length,
    seed: player.seed,
    finalRank: standing.rank,
    placementDelta: player.seed - standing.rank,
    score: aggregate.score,
    scorePercentage: getScorePercentage(aggregate.score, aggregate.gamesPlayed, aggregate.byes),
    buchholz: standing.buchholz,
    gamesPlayed: aggregate.gamesPlayed,
    wins: aggregate.wins,
    draws: aggregate.draws,
    losses: aggregate.losses,
    byes: aggregate.byes,
    whiteGames: aggregate.whiteGames,
    blackGames: aggregate.blackGames,
    colorImbalance: aggregate.whiteGames - aggregate.blackGames,
    longestWhiteStreak: computeLongestColorStreak(colorHistory, 'W'),
    longestBlackStreak: computeLongestColorStreak(colorHistory, 'B'),
    enteredRound: player.enteredRound,
    droppedAfterRound: player.droppedAfterRound,
    lateEntry: player.enteredRound > 1,
    dropped: player.droppedAfterRound !== null,
    undefeated: aggregate.losses === 0 && aggregate.gamesPlayed + aggregate.byes > 0,
    opponents: buildTournamentOpponentStats(player.id, snapshot),
    rounds: buildRoundProgression(player.id, snapshot),
  }
}

function updateHeadToHeadStats(
  target: Map<string, PlayerHeadToHeadStat>,
  tournament: PlayerTournamentStat,
): void {
  const seenTournamentKeys = new Set<string>()

  for (const opponent of tournament.opponents) {
    if (!opponent.opponentName || opponent.opponentName === 'BYE' || opponent.result === null) {
      continue
    }

    const key = opponent.opponentPlayerId ?? `name:${opponent.opponentName}`
    const current = target.get(key) ?? {
      opponentPlayerId: opponent.opponentPlayerId,
      opponentName: opponent.opponentName,
      tournamentsPlayed: 0,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      score: 0,
      whiteGames: 0,
      blackGames: 0,
      lastPlayedAt: null,
    }

    if (!seenTournamentKeys.has(key)) {
      current.tournamentsPlayed += 1
      seenTournamentKeys.add(key)
    }

    current.gamesPlayed += 1
    current.score += opponent.points
    current.lastPlayedAt =
      !current.lastPlayedAt || new Date(tournament.updatedAt).getTime() > new Date(current.lastPlayedAt).getTime()
        ? tournament.updatedAt
        : current.lastPlayedAt

    if (opponent.color === 'W') {
      current.whiteGames += 1
    }

    if (opponent.color === 'B') {
      current.blackGames += 1
    }

    switch (opponent.result) {
      case '1-0':
        if (opponent.color === 'W') {
          current.wins += 1
        } else {
          current.losses += 1
        }
        break
      case '0-1':
        if (opponent.color === 'B') {
          current.wins += 1
        } else {
          current.losses += 1
        }
        break
      case '0.5-0.5':
        current.draws += 1
        break
      default:
        break
    }

    target.set(key, current)
  }
}

function createByeHistory(tournaments: PlayerTournamentStat[]): PlayerByeHistoryItem[] {
  return tournaments.flatMap((tournament) =>
    tournament.opponents
      .filter((opponent) => opponent.opponentName === 'BYE' && opponent.result === 'BYE')
      .map((opponent) => ({
        tournamentId: tournament.tournamentId,
        tournamentName: tournament.tournamentName,
        updatedAt: tournament.updatedAt,
        round: opponent.round,
      })),
  )
}

function buildHeadToHeadTournament(
  context: HeadToHeadContext,
  snapshot: TournamentSnapshot,
): HeadToHeadTournament | null {
  const matches = sortMatchesChronologically(snapshot.matches)
    .filter((match) => {
      if (match.isBye || match.blackPlayerId === null || match.result === null) {
        return false
      }

      const whiteLibraryPlayerId = snapshot.playerById.get(match.whitePlayerId)?.libraryPlayerId ?? null
      const blackLibraryPlayerId = snapshot.playerById.get(match.blackPlayerId)?.libraryPlayerId ?? null

      return (
        (whiteLibraryPlayerId === context.leftPlayerId && blackLibraryPlayerId === context.rightPlayerId) ||
        (whiteLibraryPlayerId === context.rightPlayerId && blackLibraryPlayerId === context.leftPlayerId)
      )
    })
    .map((match) => {
      const whiteLibraryPlayerId = snapshot.playerById.get(match.whitePlayerId)?.libraryPlayerId ?? null
      const leftIsWhite = whiteLibraryPlayerId === context.leftPlayerId

      const entry: HeadToHeadMatch = {
        tournamentId: snapshot.record.tournament_id,
        tournamentName: snapshot.record.name,
        updatedAt: snapshot.record.updated_at,
        round: match.round,
        board: match.board,
        result: match.result,
        leftColor: leftIsWhite ? 'W' : 'B',
        rightColor: leftIsWhite ? 'B' : 'W',
        leftPoints: getMatchPointsForPlayer(match, leftIsWhite ? match.whitePlayerId : (match.blackPlayerId as string)),
        rightPoints: getMatchPointsForPlayer(match, leftIsWhite ? (match.blackPlayerId as string) : match.whitePlayerId),
      }

      return entry
    })

  if (matches.length === 0) {
    return null
  }

  return {
    tournamentId: snapshot.record.tournament_id,
    tournamentName: snapshot.record.name,
    updatedAt: snapshot.record.updated_at,
    status: snapshot.record.status,
    leftScore: matches.reduce((total, match) => total + match.leftPoints, 0),
    rightScore: matches.reduce((total, match) => total + match.rightPoints, 0),
    gamesPlayed: matches.length,
    matches,
  }
}

function finalizeSummary(accumulator: SummaryAccumulator): PlayerStatsSummary {
  const { summary, buchholzSamples, whiteWins, whiteCompletedGames, blackWins, blackCompletedGames } = accumulator
  const latestBuchholzSample = [...buchholzSamples].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )[0]

  summary.colorImbalance = summary.whiteGames - summary.blackGames
  summary.scorePercentage = getScorePercentage(summary.totalScore, summary.gamesPlayed, summary.byes)
  summary.winRate = summary.gamesPlayed > 0 ? summary.wins / summary.gamesPlayed : 0
  summary.drawRate = summary.gamesPlayed > 0 ? summary.draws / summary.gamesPlayed : 0
  summary.lossRate = summary.gamesPlayed > 0 ? summary.losses / summary.gamesPlayed : 0
  summary.winRateAsWhite = whiteCompletedGames > 0 ? whiteWins / whiteCompletedGames : 0
  summary.winRateAsBlack = blackCompletedGames > 0 ? blackWins / blackCompletedGames : 0
  summary.averageBuchholz =
    buchholzSamples.length > 0
      ? buchholzSamples.reduce((total, sample) => total + sample.value, 0) / buchholzSamples.length
      : 0
  summary.bestBuchholz =
    buchholzSamples.length > 0 ? Math.max(...buchholzSamples.map((sample) => sample.value)) : 0
  summary.latestBuchholz = latestBuchholzSample?.value ?? null

  return summary
}

async function loadStatsProjection(username: AllowedUsername): Promise<{
  libraryRows: LibraryRow[]
  tournamentRows: TournamentRecordRow[]
  playerRows: TournamentPlayerProjectionRow[]
  matchRows: MatchProjectionRow[]
}> {
  await ensureLibrarySchema()

  const [libraryRows, tournamentRows, playerRows, matchRows] = await Promise.all([
    sql`
      select id, display_name, created_at
      from player_library
      where username = ${username}
      order by display_name asc
    `,
    sql`
      select tournament_id, name, status, total_rounds, current_round, created_at, updated_at
      from tournament_records
      where username = ${username}
      order by updated_at desc
    `,
    sql`
      select
        tournament_player_id,
        library_player_id,
        tournament_id,
        name_snapshot,
        seed,
        entered_round,
        dropped_after_round
      from tournament_player_entries
      where username = ${username}
    `,
    sql`
      select
        match_id,
        tournament_id,
        round,
        board,
        white_tournament_player_id,
        black_tournament_player_id,
        white_library_player_id,
        black_library_player_id,
        result,
        is_bye
      from tournament_match_entries
      where username = ${username}
    `,
  ])

  return {
    libraryRows: libraryRows as LibraryRow[],
    tournamentRows: tournamentRows as TournamentRecordRow[],
    playerRows: playerRows as TournamentPlayerProjectionRow[],
    matchRows: matchRows as MatchProjectionRow[],
  }
}

async function buildStatsData(username: AllowedUsername): Promise<{
  summaries: PlayerStatsSummary[]
  details: Map<string, PlayerStatsDetail>
}> {
  const { libraryRows, tournamentRows, playerRows, matchRows } = await loadStatsProjection(username)
  const snapshots = buildTournamentSnapshots(tournamentRows, playerRows, matchRows)
  const summaryAccumulators = new Map<string, SummaryAccumulator>(
    libraryRows.map((row) => [row.id, createSummaryAccumulator(row)]),
  )
  const detailMap = new Map<string, PlayerStatsDetail>()

  for (const row of libraryRows) {
    const tournaments = [...snapshots.values()]
      .map((snapshot) => buildPlayerTournamentStat(row.id, snapshot))
      .filter((entry): entry is PlayerTournamentStat => entry !== null)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())

    if (tournaments.length === 0) {
      continue
    }

    const accumulator = summaryAccumulators.get(row.id)

    if (!accumulator) {
      continue
    }

    for (const tournament of tournaments) {
      accumulator.summary.tournamentsPlayed += 1
      accumulator.summary.completedTournaments += tournament.status === 'completed' ? 1 : 0
      accumulator.summary.partialTournaments += tournament.status === 'completed' ? 0 : 1
      accumulator.summary.gamesPlayed += tournament.gamesPlayed
      accumulator.summary.totalScore += tournament.score
      accumulator.summary.wins += tournament.wins
      accumulator.summary.draws += tournament.draws
      accumulator.summary.losses += tournament.losses
      accumulator.summary.byes += tournament.byes
      accumulator.summary.undefeatedTournaments += tournament.undefeated ? 1 : 0
      accumulator.summary.lateEntries += tournament.lateEntry ? 1 : 0
      accumulator.summary.dropouts += tournament.dropped ? 1 : 0
      accumulator.summary.whiteGames += tournament.whiteGames
      accumulator.summary.blackGames += tournament.blackGames
      accumulator.summary.longestWhiteStreak = Math.max(
        accumulator.summary.longestWhiteStreak,
        tournament.longestWhiteStreak,
      )
      accumulator.summary.longestBlackStreak = Math.max(
        accumulator.summary.longestBlackStreak,
        tournament.longestBlackStreak,
      )
      accumulator.summary.lastPlayedAt =
        !accumulator.summary.lastPlayedAt ||
        new Date(tournament.updatedAt).getTime() > new Date(accumulator.summary.lastPlayedAt).getTime()
          ? tournament.updatedAt
          : accumulator.summary.lastPlayedAt
      accumulator.buchholzSamples.push({
        value: tournament.buchholz,
        updatedAt: tournament.updatedAt,
      })

      for (const opponent of tournament.opponents) {
        if (opponent.opponentName === 'BYE' || opponent.result === null || opponent.color === null) {
          continue
        }

        if (opponent.color === 'W') {
          accumulator.whiteCompletedGames += 1

          if (opponent.result === '1-0') {
            accumulator.whiteWins += 1
          }
        } else {
          accumulator.blackCompletedGames += 1

          if (opponent.result === '0-1') {
            accumulator.blackWins += 1
          }
        }
      }
    }

    const headToHeadMap = new Map<string, PlayerHeadToHeadStat>()
    for (const tournament of tournaments) {
      updateHeadToHeadStats(headToHeadMap, tournament)
    }

    detailMap.set(row.id, {
      summary: finalizeSummary(accumulator),
      tournaments,
      headToHead: [...headToHeadMap.values()].sort((left, right) => {
        if (left.gamesPlayed !== right.gamesPlayed) {
          return right.gamesPlayed - left.gamesPlayed
        }

        return left.opponentName.localeCompare(right.opponentName)
      }),
      byeHistory: createByeHistory(tournaments),
    })
  }

  return {
    summaries: [...detailMap.values()]
      .map((detail) => detail.summary)
      .sort((left, right) => {
        if (left.totalScore !== right.totalScore) {
          return right.totalScore - left.totalScore
        }

        return left.name.localeCompare(right.name)
      }),
    details: detailMap,
  }
}

export async function listPlayerStats(
  username: AllowedUsername,
): Promise<PlayerStatsSummary[]> {
  const { summaries } = await buildStatsData(username)

  return summaries
}

export async function getPlayerStatsDetail(
  username: AllowedUsername,
  playerId: string,
): Promise<PlayerStatsDetail | null> {
  const { details } = await buildStatsData(username)

  return details.get(playerId) ?? null
}

export async function getHeadToHeadDetail(
  username: AllowedUsername,
  leftPlayerId: string,
  rightPlayerId: string,
): Promise<HeadToHeadDetail | null> {
  if (leftPlayerId === rightPlayerId) {
    return null
  }

  const { libraryRows, tournamentRows, playerRows, matchRows } = await loadStatsProjection(username)
  const leftPlayer = libraryRows.find((row) => row.id === leftPlayerId)
  const rightPlayer = libraryRows.find((row) => row.id === rightPlayerId)

  if (!leftPlayer || !rightPlayer) {
    return null
  }

  const snapshots = buildTournamentSnapshots(tournamentRows, playerRows, matchRows)
  const context: HeadToHeadContext = {
    leftPlayerId,
    leftPlayerName: leftPlayer.display_name,
    rightPlayerId,
    rightPlayerName: rightPlayer.display_name,
  }

  const tournaments = [...snapshots.values()]
    .map((snapshot) => buildHeadToHeadTournament(context, snapshot))
    .filter((entry): entry is HeadToHeadTournament => entry !== null)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())

  const detail: HeadToHeadDetail = {
    leftPlayerId,
    leftPlayerName: leftPlayer.display_name,
    rightPlayerId,
    rightPlayerName: rightPlayer.display_name,
    gamesPlayed: tournaments.reduce((total, tournament) => total + tournament.gamesPlayed, 0),
    leftScore: tournaments.reduce((total, tournament) => total + tournament.leftScore, 0),
    rightScore: tournaments.reduce((total, tournament) => total + tournament.rightScore, 0),
    leftWins: tournaments.reduce(
      (total, tournament) => total + tournament.matches.filter((match) => match.leftPoints === 1).length,
      0,
    ),
    rightWins: tournaments.reduce(
      (total, tournament) => total + tournament.matches.filter((match) => match.rightPoints === 1).length,
      0,
    ),
    draws: tournaments.reduce(
      (total, tournament) => total + tournament.matches.filter((match) => match.leftPoints === 0.5).length,
      0,
    ),
    leftWhiteGames: tournaments.reduce(
      (total, tournament) => total + tournament.matches.filter((match) => match.leftColor === 'W').length,
      0,
    ),
    leftBlackGames: tournaments.reduce(
      (total, tournament) => total + tournament.matches.filter((match) => match.leftColor === 'B').length,
      0,
    ),
    rightWhiteGames: tournaments.reduce(
      (total, tournament) => total + tournament.matches.filter((match) => match.rightColor === 'W').length,
      0,
    ),
    rightBlackGames: tournaments.reduce(
      (total, tournament) => total + tournament.matches.filter((match) => match.rightColor === 'B').length,
      0,
    ),
    lastPlayedAt: tournaments[0]?.updatedAt ?? null,
    tournaments,
  }

  return detail
}

export async function deletePlayerStats(
  username: AllowedUsername,
  playerId: string,
): Promise<boolean> {
  const existing = (await sql`
    select id
    from player_library
    where username = ${username}
      and id = ${playerId}
    limit 1
  `) as Array<{ id: string }>

  if (!existing[0]) {
    return false
  }

  await sql`
    update tournament_match_entries
    set
      white_library_player_id = case
        when white_library_player_id = ${playerId} then null
        else white_library_player_id
      end,
      black_library_player_id = case
        when black_library_player_id = ${playerId} then null
        else black_library_player_id
      end
    where username = ${username}
      and (
        white_library_player_id = ${playerId}
        or black_library_player_id = ${playerId}
      )
  `

  await sql`
    delete from tournament_player_entries
    where username = ${username}
      and library_player_id = ${playerId}
  `

  await sql`
    delete from player_library
    where username = ${username}
      and id = ${playerId}
  `

  return true
}
