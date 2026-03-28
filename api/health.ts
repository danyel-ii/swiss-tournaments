import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../server/db.js'
import { sendJson, sendMethodNotAllowed, setNoStore } from '../server/http.js'

interface HealthRow {
  ok: number
  now: string
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  setNoStore(response)

  if (request.method !== 'GET') {
    sendMethodNotAllowed(response, ['GET'])
    return
  }

  try {
    const result = (await sql`
      select 1 as ok, now()::text as now
    `) as HealthRow[]

    sendJson(response, 200, {
      status: 'ok',
      database: result[0]?.ok === 1 ? 'ok' : 'error',
      databaseTime: result[0]?.now ?? null,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    })
  } catch (error) {
    sendJson(response, 503, {
      status: 'error',
      database: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      error: error instanceof Error ? error.message : 'Database health check failed',
    })
  }
}
