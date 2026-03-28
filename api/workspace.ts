import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUsername } from '../server/auth'
import { sql } from '../server/db'
import { sendJson, sendMethodNotAllowed, setNoStore, parseJsonBody } from '../server/http'
import { createDefaultTournamentCollection } from '../server/workspace'
import type { TournamentCollection } from '../src/types/workspace'

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

    sendJson(response, 200, { ok: true })
    return
  }

  sendMethodNotAllowed(response, ['GET', 'PUT'])
}
