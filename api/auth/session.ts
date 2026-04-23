import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSessionUsername } from '../../server/auth.js'
import { withApiErrorHandling } from '../../server/errors.js'
import { sendJson, sendMethodNotAllowed, setNoStore } from '../../server/http.js'

async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  setNoStore(response)

  if (request.method !== 'GET') {
    sendMethodNotAllowed(response, ['GET'])
    return
  }

  const username = await getSessionUsername(request)

  sendJson(response, 200, {
    user: username ? { username } : null,
  })
}

export default withApiErrorHandling(handler)
