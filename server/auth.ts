import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './db.js'
import { getPasswordHashForUsername, isAllowedUsername, type AllowedUsername } from './config.js'

const SESSION_COOKIE_NAME = 'swiss_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14
const LOGIN_WINDOW_MS = 1000 * 60 * 15
const LOGIN_BLOCK_MS = 1000 * 60 * 15
const LOGIN_MAX_FAILURES = 5
const MAX_USERNAME_LENGTH = 64
const MAX_PASSWORD_LENGTH = 256

type LoginThrottleScope = 'ip' | 'username'

interface LoginThrottleEntry {
  scope: LoginThrottleScope
  throttleKey: string
  failureCount: number
  firstFailureAt: string
  blockedUntil: string | null
}

let ensureAuthSchemaPromise: Promise<void> | null = null

export function parseCookies(request: VercelRequest): Map<string, string> {
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

export function getSessionIdFromRequest(request: VercelRequest): string | null {
  return parseCookies(request).get(SESSION_COOKIE_NAME) ?? null
}

function getForwardedClientIp(request: VercelRequest): string | null {
  const forwardedForHeader = request.headers['x-forwarded-for']
  const realIpHeader = request.headers['x-real-ip']
  const forwardedFor =
    typeof forwardedForHeader === 'string'
      ? forwardedForHeader
      : Array.isArray(forwardedForHeader)
        ? forwardedForHeader[0]
        : null
  const realIp =
    typeof realIpHeader === 'string'
      ? realIpHeader
      : Array.isArray(realIpHeader)
        ? realIpHeader[0]
        : null
  const candidate = forwardedFor?.split(',')[0]?.trim() || realIp?.trim() || null

  return candidate && candidate.length <= 128 ? candidate : null
}

function hashThrottleValue(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function buildThrottleEntries(
  username: string,
  clientIp: string | null,
): Array<{ scope: LoginThrottleScope; throttleKey: string }> {
  const entries: Array<{ scope: LoginThrottleScope; throttleKey: string }> = [
    {
      scope: 'username',
      throttleKey: hashThrottleValue(`username:${username}`),
    },
  ]

  if (clientIp) {
    entries.push({
      scope: 'ip',
      throttleKey: hashThrottleValue(`ip:${clientIp}`),
    })
  }

  return entries
}

function isExpired(dateValue: string | null, now: Date): boolean {
  return !dateValue || new Date(dateValue).getTime() <= now.getTime()
}

function getRetryAfterSeconds(blockedUntil: string, now: Date): number {
  return Math.max(1, Math.ceil((new Date(blockedUntil).getTime() - now.getTime()) / 1000))
}

async function ensureAuthSchema(): Promise<void> {
  if (!ensureAuthSchemaPromise) {
    ensureAuthSchemaPromise = (async () => {
      await sql`
        create table if not exists login_throttles (
          scope text not null check (scope in ('ip', 'username')),
          throttle_key text not null,
          failure_count integer not null,
          first_failure_at timestamptz not null,
          blocked_until timestamptz,
          updated_at timestamptz not null default now(),
          primary key (scope, throttle_key)
        )
      `
    })()
  }

  await ensureAuthSchemaPromise
}

async function loadThrottleEntries(
  entries: Array<{ scope: LoginThrottleScope; throttleKey: string }>,
): Promise<LoginThrottleEntry[]> {
  if (entries.length === 0) {
    return []
  }

  await ensureAuthSchema()

  const usernameEntry = entries.find((entry) => entry.scope === 'username') ?? null
  const ipEntry = entries.find((entry) => entry.scope === 'ip') ?? null

  return (await sql`
    select
      scope,
      throttle_key,
      failure_count,
      first_failure_at,
      blocked_until
    from login_throttles
    where (${usernameEntry !== null} and scope = 'username' and throttle_key = ${usernameEntry?.throttleKey ?? ''})
       or (${ipEntry !== null} and scope = 'ip' and throttle_key = ${ipEntry?.throttleKey ?? ''})
  `) as LoginThrottleEntry[]
}

async function upsertThrottleEntry(
  entry: LoginThrottleEntry,
): Promise<void> {
  await sql`
    insert into login_throttles (
      scope,
      throttle_key,
      failure_count,
      first_failure_at,
      blocked_until,
      updated_at
    )
    values (
      ${entry.scope},
      ${entry.throttleKey},
      ${entry.failureCount},
      ${entry.firstFailureAt},
      ${entry.blockedUntil},
      now()
    )
    on conflict (scope, throttle_key)
    do update set
      failure_count = excluded.failure_count,
      first_failure_at = excluded.first_failure_at,
      blocked_until = excluded.blocked_until,
      updated_at = now()
  `
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

export function isValidCredentialInput(username: string, password: string): boolean {
  return (
    username.length > 0 &&
    username.length <= MAX_USERNAME_LENGTH &&
    password.length > 0 &&
    password.length <= MAX_PASSWORD_LENGTH
  )
}

export async function getLoginThrottleState(
  request: VercelRequest,
  username: string,
): Promise<{ blocked: false } | { blocked: true; retryAfterSeconds: number }> {
  const now = new Date()
  const throttleEntries = buildThrottleEntries(username, getForwardedClientIp(request))
  const existingEntries = await loadThrottleEntries(throttleEntries)

  for (const entry of existingEntries) {
    if (!isExpired(entry.blockedUntil, now) && entry.blockedUntil) {
      return {
        blocked: true,
        retryAfterSeconds: getRetryAfterSeconds(entry.blockedUntil, now),
      }
    }
  }

  return { blocked: false }
}

export async function recordFailedLoginAttempt(
  request: VercelRequest,
  username: string,
): Promise<void> {
  const now = new Date()
  const throttleEntries = buildThrottleEntries(username, getForwardedClientIp(request))
  const existingEntries = await loadThrottleEntries(throttleEntries)
  const existingEntryMap = new Map(
    existingEntries.map((entry) => [`${entry.scope}:${entry.throttleKey}`, entry]),
  )

  await Promise.all(
    throttleEntries.map(async ({ scope, throttleKey }) => {
      const existingEntry = existingEntryMap.get(`${scope}:${throttleKey}`)
      const firstFailureAt =
        existingEntry && now.getTime() - new Date(existingEntry.firstFailureAt).getTime() < LOGIN_WINDOW_MS
          ? new Date(existingEntry.firstFailureAt)
          : now
      const failureCount =
        existingEntry && now.getTime() - new Date(existingEntry.firstFailureAt).getTime() < LOGIN_WINDOW_MS
          ? existingEntry.failureCount + 1
          : 1
      const blockedUntil =
        failureCount >= LOGIN_MAX_FAILURES
          ? new Date(now.getTime() + LOGIN_BLOCK_MS).toISOString()
          : null

      await upsertThrottleEntry({
        scope,
        throttleKey,
        failureCount,
        firstFailureAt: firstFailureAt.toISOString(),
        blockedUntil,
      })
    }),
  )
}

export async function clearLoginThrottleState(
  request: VercelRequest,
  username: string,
): Promise<void> {
  const throttleEntries = buildThrottleEntries(username, getForwardedClientIp(request))

  if (throttleEntries.length === 0) {
    return
  }

  await ensureAuthSchema()

  const usernameEntry = throttleEntries.find((entry) => entry.scope === 'username') ?? null
  const ipEntry = throttleEntries.find((entry) => entry.scope === 'ip') ?? null

  await sql`
    delete from login_throttles
    where (${usernameEntry !== null} and scope = 'username' and throttle_key = ${usernameEntry?.throttleKey ?? ''})
       or (${ipEntry !== null} and scope = 'ip' and throttle_key = ${ipEntry?.throttleKey ?? ''})
  `
}

export async function getSessionUsername(
  request: VercelRequest,
): Promise<AllowedUsername | null> {
  const sessionId = getSessionIdFromRequest(request)

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
