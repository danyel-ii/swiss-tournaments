import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  attachSessionCookie,
  authenticateCredentials,
  clearLoginThrottleState,
  createSession,
  getLoginThrottleState,
  isValidCredentialInput,
  recordFailedLoginAttempt,
} from '../../server/auth.js'
import {
  sendJson,
  sendMethodNotAllowed,
  setNoStore,
  requireTrustedOrigin,
  tryParseJsonBody,
} from '../../server/http.js'

interface LoginBody {
  username?: string
  password?: string
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

  if (!requireTrustedOrigin(request, response)) {
    return
  }

  const parsedBody = tryParseJsonBody<LoginBody>(request)

  if (!parsedBody.ok) {
    sendJson(response, 400, { error: 'Invalid JSON body' })
    return
  }

  const body = parsedBody.value
  const username = body?.username?.trim().toLowerCase() ?? ''
  const password = body?.password ?? ''

  if (!isValidCredentialInput(username, password)) {
    sendJson(response, 401, { error: 'Invalid username or password' })
    return
  }

  const throttleState = await getLoginThrottleState(request, username)

  if (throttleState.blocked) {
    response.setHeader('Retry-After', String(throttleState.retryAfterSeconds))
    sendJson(response, 429, { error: 'Too many login attempts. Try again later.' })
    return
  }

  const authenticatedUsername = await authenticateCredentials(username, password)

  if (!authenticatedUsername) {
    await recordFailedLoginAttempt(request, username)
    sendJson(response, 401, { error: 'Invalid username or password' })
    return
  }

  await clearLoginThrottleState(request, authenticatedUsername)
  const session = await createSession(authenticatedUsername)
  attachSessionCookie(response, session.sessionId, session.expiresAt)
  sendJson(response, 200, { user: { username: authenticatedUsername } })
}
