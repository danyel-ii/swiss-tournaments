import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearSessionCookie, deleteSession } from '../../server/auth.js'
import { sendJson, sendMethodNotAllowed, setNoStore } from '../../server/http.js'

function getSessionIdFromCookie(request: VercelRequest): string | null {
  const rawCookie = request.headers.cookie

  if (!rawCookie) {
    return null
  }

  const cookie = rawCookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('swiss_session='))

  return cookie ? decodeURIComponent(cookie.slice('swiss_session='.length)) : null
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  setNoStore(response)

  if (request.method !== 'POST') {
    sendMethodNotAllowed(response, ['POST'])
    return
  }

  const sessionId = getSessionIdFromCookie(request)

  if (sessionId) {
    await deleteSession(sessionId)
  }

  clearSessionCookie(response)
  sendJson(response, 200, { ok: true })
}
