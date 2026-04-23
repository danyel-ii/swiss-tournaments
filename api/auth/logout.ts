import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearSessionCookie, deleteSession, getSessionIdFromRequest } from '../../server/auth.js'
import { withApiErrorHandling } from '../../server/errors.js'
import { sendJson, sendMethodNotAllowed, setNoStore, requireTrustedOrigin } from '../../server/http.js'

async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  setNoStore(response)

  if (request.method !== 'POST') {
    sendMethodNotAllowed(response, ['POST'])
    return
  }

  if (!requireTrustedOrigin(request, response)) {
    return
  }

  const sessionId = getSessionIdFromRequest(request)

  if (sessionId) {
    await deleteSession(sessionId)
  }

  clearSessionCookie(response)
  sendJson(response, 200, { ok: true })
}

export default withApiErrorHandling(handler)
