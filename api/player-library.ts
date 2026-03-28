import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUsername } from '../server/auth.js'
import { sendJson, sendMethodNotAllowed, setNoStore, requireTrustedOrigin } from '../server/http.js'
import { hideLibraryPlayer, listLibraryPlayers } from '../server/library.js'

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  setNoStore(response)
  const username = await requireUsername(request, response)

  if (!username) {
    return
  }

  if (request.method === 'DELETE') {
    if (!requireTrustedOrigin(request, response)) {
      return
    }

    const playerId = typeof request.query.playerId === 'string' ? request.query.playerId : null

    if (!playerId) {
      sendJson(response, 400, { error: 'playerId is required' })
      return
    }

    const deleted = await hideLibraryPlayer(username, playerId)

    if (!deleted) {
      sendJson(response, 404, { error: 'Library player not found' })
      return
    }

    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method !== 'GET') {
    sendMethodNotAllowed(response, ['GET', 'DELETE'])
    return
  }

  sendJson(response, 200, {
    players: await listLibraryPlayers(username),
  })
}
