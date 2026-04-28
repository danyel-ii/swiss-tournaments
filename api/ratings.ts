import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUsername } from '../server/auth.js'
import { withApiErrorHandling } from '../server/errors.js'
import { sendJson, sendMethodNotAllowed, setNoStore } from '../server/http.js'
import { listPlayerRatingEvents, listPlayerRatings } from '../server/ratings.js'

async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  setNoStore(response)
  const username = await requireUsername(request, response)

  if (!username) {
    return
  }

  if (request.method !== 'GET') {
    sendMethodNotAllowed(response, ['GET'])
    return
  }

  const playerId = typeof request.query.playerId === 'string' ? request.query.playerId : undefined
  const history = request.query.history === '1'

  if (history) {
    sendJson(response, 200, {
      events: await listPlayerRatingEvents(username, playerId),
    })
    return
  }

  sendJson(response, 200, {
    ratings: await listPlayerRatings(username),
  })
}

export default withApiErrorHandling(handler)
