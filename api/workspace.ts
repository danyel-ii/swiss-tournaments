import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUsername } from '../server/auth.js'
import { sql } from '../server/db.js'
import { sendJson, sendMethodNotAllowed, setNoStore, parseJsonBody } from '../server/http.js'
import { syncWorkspaceProjection } from '../server/library.js'
import { createDefaultTournamentCollection } from '../server/workspace.js'
import type { TournamentCollection } from '../src/types/workspace.js'

function normalizeCollection(value: unknown): TournamentCollection {
  const fallback = createDefaultTournamentCollection()

  if (!value || typeof value !== 'object') {
    return fallback
  }

  const candidate = value as Partial<TournamentCollection>

  if (!Array.isArray(candidate.tournaments) || typeof candidate.activeTournamentId !== 'string') {
    return fallback
  }

  return {
    activeTournamentId: candidate.activeTournamentId,
    tournaments: candidate.tournaments,
  } as TournamentCollection
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
    const payload = normalizeCollection(parseJsonBody<TournamentCollection>(request))

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
    const scope = typeof request.query.scope === 'string' ? request.query.scope : null
    const tournamentId =
      typeof request.query.tournamentId === 'string' ? request.query.tournamentId : null

    if (scope === 'all') {
      await sql`delete from tournament_match_entries where username = ${username}`
      await sql`delete from tournament_player_entries where username = ${username}`
      await sql`delete from tournament_records where username = ${username}`
      await sql`delete from player_library where username = ${username}`
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
