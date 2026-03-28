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

interface EmailTournamentReportBody {
  tournamentId?: unknown
  tournamentName?: unknown
  report?: unknown
}

function normalizeEmailTournamentReportBody(
  value: EmailTournamentReportBody | null,
): { tournamentId: string; tournamentName: string; report: string } | null {
  if (
    typeof value?.tournamentId !== 'string' ||
    typeof value?.tournamentName !== 'string' ||
    typeof value?.report !== 'string'
  ) {
    return null
  }

  const tournamentId = value.tournamentId.trim()
  const tournamentName = value.tournamentName.trim()
  const report = value.report

  if (
    tournamentId.length === 0 ||
    tournamentId.length > 128 ||
    tournamentName.length === 0 ||
    tournamentName.length > 200 ||
    report.length === 0 ||
    report.length > 200_000
  ) {
    return null
  }

  return {
    tournamentId,
    tournamentName,
    report,
  }
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

  const requestBody = normalizeEmailTournamentReportBody(parsedBody.value)

  if (!requestBody) {
    sendJson(response, 400, { error: 'Invalid tournament report payload' })
    return
  }

  const result = await sendTournamentReportEmail(username, requestBody)

  if (result.ok === false) {
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
