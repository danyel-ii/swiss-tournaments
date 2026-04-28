import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUsername } from '../server/auth.js'
import { withApiErrorHandling } from '../server/errors.js'
import {
  requireTrustedOrigin,
  sendJson,
  sendMethodNotAllowed,
  setNoStore,
  tryParseJsonBody,
} from '../server/http.js'
import {
  archiveOngoingTable,
  createOngoingTable,
  createOngoingTableGame,
  deleteOngoingTable,
  getOngoingTableDetail,
  listOngoingTables,
  setOngoingTableGameResult,
  suggestOngoingPairing,
  updateOngoingTablePlayers,
} from '../server/ongoingTables.js'
import type { ManualMatchResult } from '../src/types/tournament.js'
import type { OngoingTableSettings } from '../src/types/ongoingTable.js'

interface OngoingTableBody {
  name?: string
  playerIds?: string[]
  addPlayerIds?: string[]
  removePlayerIds?: string[]
  settings?: Partial<OngoingTableSettings>
  batch?: boolean
  whitePlayerId?: string
  blackPlayerId?: string
  pairingWeight?: number | null
  pairingSnapshot?: unknown
  gameId?: string
  result?: ManualMatchResult
}

function parseBody(request: VercelRequest, response: VercelResponse): OngoingTableBody | null {
  const parsed = tryParseJsonBody<OngoingTableBody>(request)

  if (!parsed.ok) {
    sendJson(response, 400, { error: 'Invalid JSON body' })
    return null
  }

  return parsed.value ?? {}
}

function isManualMatchResult(value: unknown): value is ManualMatchResult {
  return value === '1-0' || value === '0-1' || value === '0.5-0.5' || value === '0-0'
}

async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  setNoStore(response)
  const username = await requireUsername(request, response)

  if (!username) {
    return
  }

  const tableId = typeof request.query.tableId === 'string' ? request.query.tableId : null
  const action = typeof request.query.action === 'string' ? request.query.action : null

  if (request.method === 'GET') {
    if (tableId) {
      const detail = await getOngoingTableDetail(username, tableId)

      if (!detail) {
        sendJson(response, 404, { error: 'Table not found' })
        return
      }

      sendJson(response, 200, { table: detail })
      return
    }

    sendJson(response, 200, { tables: await listOngoingTables(username) })
    return
  }

  if (request.method !== 'POST' && request.method !== 'PUT' && request.method !== 'DELETE') {
    sendMethodNotAllowed(response, ['GET', 'POST', 'PUT', 'DELETE'])
    return
  }

  if (!requireTrustedOrigin(request, response)) {
    return
  }

  if (request.method === 'POST' && !tableId && !action) {
    const body = parseBody(request, response)

    if (!body) {
      return
    }

    if (typeof body.name !== 'string' || !Array.isArray(body.playerIds)) {
      sendJson(response, 400, { error: 'name and playerIds are required' })
      return
    }

    try {
      const table = await createOngoingTable({
        username,
        name: body.name,
        playerIds: body.playerIds,
        settings: body.settings,
      })
      sendJson(response, 201, { table })
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : 'Unable to create table' })
    }
    return
  }

  if (!tableId) {
    sendJson(response, 400, { error: 'tableId is required' })
    return
  }

  if (request.method === 'PUT') {
    const body = parseBody(request, response)

    if (!body) {
      return
    }

    try {
      const table = await updateOngoingTablePlayers({
        username,
        tableId,
        name: body.name,
        addPlayerIds: body.addPlayerIds,
        removePlayerIds: body.removePlayerIds,
        settings: body.settings,
      })

      if (!table) {
        sendJson(response, 404, { error: 'Table not found' })
        return
      }

      sendJson(response, 200, { table })
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : 'Unable to update table' })
    }
    return
  }

  if (request.method === 'DELETE') {
    const deleted = await deleteOngoingTable(username, tableId)

    if (!deleted) {
      sendJson(response, 404, { error: 'Table not found' })
      return
    }

    sendJson(response, 200, { ok: true })
    return
  }

  const body = parseBody(request, response)

  if (!body) {
    return
  }

  if (action === 'suggest') {
    sendJson(response, 200, {
      candidates: await suggestOngoingPairing({ username, tableId, batch: body.batch }),
    })
    return
  }

  if (action === 'game') {
    if (typeof body.whitePlayerId !== 'string' || typeof body.blackPlayerId !== 'string') {
      sendJson(response, 400, { error: 'whitePlayerId and blackPlayerId are required' })
      return
    }

    try {
      const game = await createOngoingTableGame({
        username,
        tableId,
        whitePlayerId: body.whitePlayerId,
        blackPlayerId: body.blackPlayerId,
        pairingWeight: body.pairingWeight,
        pairingSnapshot: body.pairingSnapshot,
      })
      sendJson(response, 201, { game })
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : 'Unable to create game' })
    }
    return
  }

  if (action === 'result') {
    if (typeof body.gameId !== 'string' || !isManualMatchResult(body.result)) {
      sendJson(response, 400, { error: 'gameId and valid result are required' })
      return
    }

    const table = await setOngoingTableGameResult({
      username,
      tableId,
      gameId: body.gameId,
      result: body.result,
    })

    if (!table) {
      sendJson(response, 404, { error: 'Game not found' })
      return
    }

    sendJson(response, 200, { table })
    return
  }

  if (action === 'archive') {
    const archived = await archiveOngoingTable(username, tableId)

    if (!archived) {
      sendJson(response, 404, { error: 'Table not found' })
      return
    }

    sendJson(response, 200, { ok: true })
    return
  }

  sendJson(response, 400, { error: 'Unsupported action' })
}

export default withApiErrorHandling(handler)
