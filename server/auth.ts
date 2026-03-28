import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './db.js'
import { getPasswordHashForUsername, isAllowedUsername, type AllowedUsername } from './config.js'

const SESSION_COOKIE_NAME = 'swiss_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14

function parseCookies(request: VercelRequest): Map<string, string> {
  const rawCookie = request.headers.cookie

  if (!rawCookie) {
    return new Map()
  }

  return new Map(
    rawCookie
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf('=')
        return [
          entry.slice(0, separatorIndex),
          decodeURIComponent(entry.slice(separatorIndex + 1)),
        ]
      }),
  )
}

function serializeSessionCookie(sessionId: string, expiresAt: Date): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''

  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Expires=${expiresAt.toUTCString()}`,
    secure,
  ].join('; ')
}

function serializeClearedSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''

  return [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    secure,
  ].join('; ')
}

function verifyPassword(password: string, encodedHash: string): boolean {
  const [salt, storedHash] = encodedHash.split(':')

  if (!salt || !storedHash) {
    return false
  }

  const candidateHash = scryptSync(password, salt, 64).toString('hex')

  return timingSafeEqual(
    Buffer.from(candidateHash, 'hex'),
    Buffer.from(storedHash, 'hex'),
  )
}

export async function createSession(username: AllowedUsername): Promise<{
  sessionId: string
  expiresAt: Date
}> {
  const sessionId = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await sql`
    insert into sessions (id, username, expires_at)
    values (${sessionId}, ${username}, ${expiresAt.toISOString()})
  `

  return { sessionId, expiresAt }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sql`delete from sessions where id = ${sessionId}`
}

export async function authenticateCredentials(
  username: string,
  password: string,
): Promise<AllowedUsername | null> {
  if (!isAllowedUsername(username)) {
    return null
  }

  const passwordHash = getPasswordHashForUsername(username)

  if (!passwordHash) {
    return null
  }

  return verifyPassword(password, passwordHash) ? username : null
}

export async function getSessionUsername(
  request: VercelRequest,
): Promise<AllowedUsername | null> {
  const sessionId = parseCookies(request).get(SESSION_COOKIE_NAME)

  if (!sessionId) {
    return null
  }

  const result = (await sql`
    select username
    from sessions
    where id = ${sessionId}
      and expires_at > now()
    limit 1
  `) as Array<{ username: string }>

  const username = result[0]?.username

  if (!username || !isAllowedUsername(username)) {
    return null
  }

  return username
}

export function attachSessionCookie(
  response: VercelResponse,
  sessionId: string,
  expiresAt: Date,
): void {
  response.setHeader('Set-Cookie', serializeSessionCookie(sessionId, expiresAt))
}

export function clearSessionCookie(response: VercelResponse): void {
  response.setHeader('Set-Cookie', serializeClearedSessionCookie())
}

export async function requireUsername(
  request: VercelRequest,
  response: VercelResponse,
): Promise<AllowedUsername | null> {
  const username = await getSessionUsername(request)

  if (!username) {
    response.status(401).json({ error: 'Unauthorized' })
    return null
  }

  return username
}
