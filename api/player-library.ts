import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUsername } from '../server/auth.js'
import { sendJson, sendMethodNotAllowed, setNoStore } from '../server/http.js'
import { listLibraryPlayers } from '../server/library.js'

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

  sendJson(response, 200, {
    players: await listLibraryPlayers(username),
  })
}
