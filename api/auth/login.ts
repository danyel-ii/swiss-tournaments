import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  attachSessionCookie,
  authenticateCredentials,
  createSession,
} from '../../server/auth.js'
import { sendJson, sendMethodNotAllowed, setNoStore, parseJsonBody } from '../../server/http.js'

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

  const body = parseJsonBody<LoginBody>(request)
  const username = body?.username?.trim().toLowerCase() ?? ''
  const password = body?.password ?? ''
  const authenticatedUsername = await authenticateCredentials(username, password)

  if (!authenticatedUsername) {
    sendJson(response, 401, { error: 'Invalid username or password' })
    return
  }

  const session = await createSession(authenticatedUsername)
  attachSessionCookie(response, session.sessionId, session.expiresAt)
  sendJson(response, 200, { user: { username: authenticatedUsername } })
}
