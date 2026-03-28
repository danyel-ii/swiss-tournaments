import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUsername } from '../server/auth.js'
import { sendJson, sendMethodNotAllowed, setNoStore } from '../server/http.js'
import { deletePlayerStats, getPlayerStatsDetail, listPlayerStats } from '../server/library.js'

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  setNoStore(response)
  const username = await requireUsername(request, response)

  if (!username) {
    return
  }

  const playerId =
    typeof request.query.playerId === 'string' ? request.query.playerId : null

  if (request.method === 'DELETE') {
    if (!playerId) {
      sendJson(response, 400, { error: 'playerId is required' })
      return
    }

    const deleted = await deletePlayerStats(username, playerId)

    if (!deleted) {
      sendJson(response, 404, { error: 'Player not found' })
      return
    }

    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method !== 'GET') {
    sendMethodNotAllowed(response, ['GET', 'DELETE'])
    return
  }

  if (playerId) {
    const detail = await getPlayerStatsDetail(username, playerId)

    if (!detail) {
      sendJson(response, 404, { error: 'Player not found' })
      return
    }

    sendJson(response, 200, detail)
    return
  }

  sendJson(response, 200, {
    players: await listPlayerStats(username),
  })
}
