import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUsername } from '../server/auth.js'
import { sendJson, sendMethodNotAllowed, setNoStore } from '../server/http.js'
import { getHeadToHeadDetail } from '../server/library.js'

export default async function handler(
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

  const leftPlayerId =
    typeof request.query.leftPlayerId === 'string' ? request.query.leftPlayerId : null
  const rightPlayerId =
    typeof request.query.rightPlayerId === 'string' ? request.query.rightPlayerId : null

  if (!leftPlayerId || !rightPlayerId) {
    sendJson(response, 400, { error: 'leftPlayerId and rightPlayerId are required' })
    return
  }

  const detail = await getHeadToHeadDetail(username, leftPlayerId, rightPlayerId)

  if (!detail) {
    sendJson(response, 404, { error: 'Head-to-head pairing not found' })
    return
  }

  sendJson(response, 200, detail)
}
