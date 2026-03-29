import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUsername } from '../server/auth.js'
import { sql } from '../server/db.js'
import {
  sendJson,
  sendMethodNotAllowed,
  setNoStore,
  requireTrustedOrigin,
  tryParseJsonBody,
} from '../server/http.js'
import { syncWorkspaceProjection } from '../server/library.js'
import { createDefaultTournamentCollection } from '../server/workspace.js'
import type { TournamentCollection } from '../src/types/workspace.js'
import type { Tournament } from '../src/types/tournament.js'

function normalizeTournament(value: unknown): Tournament | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<Tournament>

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    typeof candidate.totalRounds !== 'number' ||
    typeof candidate.currentRound !== 'number' ||
    (candidate.status !== 'setup' && candidate.status !== 'in_progress' && candidate.status !== 'completed') ||
    !Array.isArray(candidate.players) ||
    !Array.isArray(candidate.matches) ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.updatedAt !== 'string'
  ) {
    return null
  }

  return {
    ...candidate,
    pairingAlgorithm:
      candidate.pairingAlgorithm === 'blossom' ? 'blossom' : 'greedy',
    version: 1,
  } as Tournament
}

function normalizeCollection(value: unknown): TournamentCollection {
  const fallback = createDefaultTournamentCollection()

  if (!value || typeof value !== 'object') {
    return fallback
  }

  const candidate = value as Partial<TournamentCollection>

  if (!Array.isArray(candidate.tournaments) || typeof candidate.activeTournamentId !== 'string') {
    return fallback
  }

  const tournaments = candidate.tournaments
    .map((tournament) => normalizeTournament(tournament))
    .filter((tournament): tournament is Tournament => tournament !== null)

  if (tournaments.length === 0) {
    return fallback
  }

  return {
    activeTournamentId: candidate.activeTournamentId,
    tournaments,
  }
}

function normalizeDeletedCollection(collection: TournamentCollection): TournamentCollection {
  if (collection.tournaments.length === 0) {
    return createDefaultTournamentCollection()
  }

  const activeTournamentId = collection.tournaments.some(
    (tournament) => tournament.id === collection.activeTournamentId,
  )
    ? collection.activeTournamentId
    : collection.tournaments[0].id

  return {
    activeTournamentId,
    tournaments: collection.tournaments,
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  setNoStore(response)
  const username = await requireUsername(request, response)

  if (!username) {
    return
  }

  if (request.method === 'GET') {
    const result = (await sql`
      select payload
      from workspaces
      where username = ${username}
      limit 1
    `) as Array<{ payload: unknown }>

    sendJson(
      response,
      200,
      normalizeCollection(result[0]?.payload ?? createDefaultTournamentCollection()),
    )
    return
  }

  if (request.method === 'PUT') {
    if (!requireTrustedOrigin(request, response)) {
      return
    }

    const parsedBody = tryParseJsonBody<TournamentCollection>(request)

    if (!parsedBody.ok) {
      sendJson(response, 400, { error: 'Invalid JSON body' })
      return
    }

    const payload = normalizeCollection(parsedBody.value)

    await sql`
      insert into workspaces (username, payload, updated_at)
      values (${username}, ${JSON.stringify(payload)}::jsonb, now())
      on conflict (username)
      do update set payload = excluded.payload, updated_at = now()
    `
    await syncWorkspaceProjection(username, payload)

    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method === 'DELETE') {
    if (!requireTrustedOrigin(request, response)) {
      return
    }

    const scope = typeof request.query.scope === 'string' ? request.query.scope : null
    const tournamentId =
      typeof request.query.tournamentId === 'string' ? request.query.tournamentId : null

    if (scope === 'all') {
      await sql`delete from tournament_match_entries where username = ${username}`
      await sql`delete from tournament_player_entries where username = ${username}`
      await sql`delete from tournament_records where username = ${username}`
      await sql`delete from workspaces where username = ${username}`

      sendJson(response, 200, createDefaultTournamentCollection())
      return
    }

    if (!tournamentId) {
      sendJson(response, 400, { error: 'tournamentId is required' })
      return
    }

    const result = (await sql`
      select payload
      from workspaces
      where username = ${username}
      limit 1
    `) as Array<{ payload: unknown }>
    const collection = normalizeCollection(result[0]?.payload ?? createDefaultTournamentCollection())
    const nextCollection = normalizeDeletedCollection({
      activeTournamentId: collection.activeTournamentId,
      tournaments: collection.tournaments.filter((tournament) => tournament.id !== tournamentId),
    })

    await sql`
      insert into workspaces (username, payload, updated_at)
      values (${username}, ${JSON.stringify(nextCollection)}::jsonb, now())
      on conflict (username)
      do update set payload = excluded.payload, updated_at = now()
    `
    await syncWorkspaceProjection(username, nextCollection)

    sendJson(response, 200, nextCollection)
    return
  }

  sendMethodNotAllowed(response, ['GET', 'PUT', 'DELETE'])
}
