import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUsername } from '../server/auth.js'
import { sendTournamentReportEmail } from '../server/reportEmail.js'
import {
  sendJson,
  sendMethodNotAllowed,
  setNoStore,
  requireTrustedOrigin,
  tryParseJsonBody,
} from '../server/http.js'
import type {
  Match,
  MatchResult,
  Player,
  Tournament,
  TournamentStatus,
} from '../src/types/tournament.js'

interface EmailTournamentReportBody {
  tournament?: unknown
}

function isTournamentStatus(value: unknown): value is TournamentStatus {
  return value === 'setup' || value === 'in_progress' || value === 'completed'
}

function isMatchResult(value: unknown): value is MatchResult | null {
  return value === null || value === '1-0' || value === '0-1' || value === '0.5-0.5' || value === '0-0' || value === 'BYE'
}

function isPlayer(value: unknown): value is Player {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Player

  return (
    typeof candidate.id === 'string' &&
    (candidate.libraryPlayerId === null || typeof candidate.libraryPlayerId === 'string') &&
    typeof candidate.name === 'string' &&
    typeof candidate.seed === 'number' &&
    Number.isFinite(candidate.seed) &&
    typeof candidate.enteredRound === 'number' &&
    Number.isFinite(candidate.enteredRound) &&
    (candidate.droppedAfterRound === null ||
      (typeof candidate.droppedAfterRound === 'number' && Number.isFinite(candidate.droppedAfterRound)))
  )
}

function isMatch(value: unknown): value is Match {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Match

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.round === 'number' &&
    Number.isFinite(candidate.round) &&
    typeof candidate.board === 'number' &&
    Number.isFinite(candidate.board) &&
    typeof candidate.whitePlayerId === 'string' &&
    (candidate.blackPlayerId === null || typeof candidate.blackPlayerId === 'string') &&
    isMatchResult(candidate.result) &&
    typeof candidate.isBye === 'boolean'
  )
}

function normalizeTournament(value: unknown): Tournament | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Tournament

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    typeof candidate.totalRounds !== 'number' ||
    !Number.isFinite(candidate.totalRounds) ||
    typeof candidate.currentRound !== 'number' ||
    !Number.isFinite(candidate.currentRound) ||
    !isTournamentStatus(candidate.status) ||
    !Array.isArray(candidate.players) ||
    !Array.isArray(candidate.matches) ||
    candidate.version !== 1 ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.updatedAt !== 'string'
  ) {
    return null
  }

  if (!candidate.players.every(isPlayer) || !candidate.matches.every(isMatch)) {
    return null
  }

  return candidate
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

  const username = await requireUsername(request, response)

  if (!username) {
    return
  }

  if (!requireTrustedOrigin(request, response)) {
    return
  }

  const parsedBody = tryParseJsonBody<EmailTournamentReportBody>(request)

  if (!parsedBody.ok) {
    sendJson(response, 400, { error: 'Invalid JSON body' })
    return
  }

  const tournament = normalizeTournament(parsedBody.value?.tournament)

  if (!tournament) {
    sendJson(response, 400, { error: 'Invalid tournament payload' })
    return
  }

  const result = await sendTournamentReportEmail(username, tournament)

  if (!result.ok) {
    if (result.status === 429) {
      response.setHeader('Retry-After', String(result.retryAfterSeconds))
      sendJson(response, 429, { error: 'Tournament report was sent recently. Try again shortly.' })
      return
    }

    sendJson(response, result.status, { error: result.error })
    return
  }

  sendJson(response, 200, { ok: true })
}
