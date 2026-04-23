import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../server/db.js'
import { classifyApiError } from '../server/errors.js'
import { sendJson, sendMethodNotAllowed, setNoStore } from '../server/http.js'

interface HealthRow {
  ok: number
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
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const classifiedError = classifyApiError(error)

    sendJson(response, 503, {
      status: 'error',
      database: 'error',
      timestamp: new Date().toISOString(),
      error: classifiedError.message,
      code: classifiedError.code,
    })
  }
}
