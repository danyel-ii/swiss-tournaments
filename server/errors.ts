import type { VercelRequest, VercelResponse } from '@vercel/node'
import { DatabaseConfigurationError } from './db.js'
import { sendJson } from './http.js'

interface ApiErrorResponse {
  status: number
  code: string
  message: string
}

interface ErrorLike {
  code?: unknown
  constraint?: unknown
  detail?: unknown
  message?: unknown
  cause?: unknown
}

function asErrorLike(error: unknown): ErrorLike {
  return error && typeof error === 'object' ? (error as ErrorLike) : {}
}

function findErrorCode(error: unknown): string | null {
  const errorLike = asErrorLike(error)

  if (typeof errorLike.code === 'string') {
    return errorLike.code
  }

  return errorLike.cause ? findErrorCode(errorLike.cause) : null
}

function findErrorMessage(error: unknown): string {
  const errorLike = asErrorLike(error)

  if (typeof errorLike.message === 'string') {
    return errorLike.message
  }

  return errorLike.cause ? findErrorMessage(errorLike.cause) : ''
}

function findConstraint(error: unknown): string {
  const errorLike = asErrorLike(error)

  if (typeof errorLike.constraint === 'string') {
    return errorLike.constraint
  }

  return errorLike.cause ? findConstraint(errorLike.cause) : ''
}

function classifyUniqueViolation(constraint: string): ApiErrorResponse {
  if (constraint.includes('player_library')) {
    return {
      status: 409,
      code: 'PLAYER_ALREADY_EXISTS',
      message: 'A player with this name already exists in your library.',
    }
  }

  if (constraint.includes('tournament_records')) {
    return {
      status: 409,
      code: 'TOURNAMENT_ALREADY_EXISTS',
      message: 'A tournament with this id already exists in your workspace.',
    }
  }

  if (constraint.includes('workspaces')) {
    return {
      status: 409,
      code: 'WORKSPACE_ALREADY_EXISTS',
      message: 'A workspace already exists for this user.',
    }
  }

  if (constraint.includes('sessions')) {
    return {
      status: 409,
      code: 'SESSION_ALREADY_EXISTS',
      message: 'A session with this id already exists. Please try again.',
    }
  }

  return {
    status: 409,
    code: 'RECORD_ALREADY_EXISTS',
    message: 'A record already exists with these values.',
  }
}

function classifyCheckViolation(constraint: string): ApiErrorResponse {
  if (constraint.includes('username')) {
    return {
      status: 400,
      code: 'USER_NOT_ALLOWED',
      message: 'This user is not allowed to access this workspace.',
    }
  }

  return {
    status: 400,
    code: 'INVALID_RECORD_VALUE',
    message: 'One or more values are not allowed.',
  }
}

export function classifyApiError(error: unknown): ApiErrorResponse {
  if (error instanceof DatabaseConfigurationError) {
    return {
      status: 503,
      code: 'DATABASE_NOT_CONFIGURED',
      message: 'Database connection is not configured. Set DATABASE_URL and try again.',
    }
  }

  const code = findErrorCode(error)
  const constraint = findConstraint(error)
  const message = findErrorMessage(error).toLowerCase()

  switch (code) {
    case '23505':
      return classifyUniqueViolation(constraint)
    case '23503':
      return {
        status: 409,
        code: 'RELATED_RECORD_NOT_FOUND',
        message: 'A related record no longer exists. Refresh and try again.',
      }
    case '23514':
      return classifyCheckViolation(constraint)
    case '42P01':
      return {
        status: 503,
        code: 'DATABASE_SCHEMA_MISSING',
        message: 'Database schema is missing. Run the schema migration and try again.',
      }
    case '42703':
      return {
        status: 503,
        code: 'DATABASE_SCHEMA_OUTDATED',
        message: 'Database schema is outdated. Run the latest migration and try again.',
      }
    case '28P01':
      return {
        status: 503,
        code: 'DATABASE_AUTH_FAILED',
        message: 'Database authentication failed. Check the database credentials.',
      }
    default:
      break
  }

  if (code?.startsWith('08') || message.includes('fetch failed') || message.includes('connection')) {
    return {
      status: 503,
      code: 'DATABASE_CONNECTION_FAILED',
      message: 'Unable to connect to the database. Try again shortly.',
    }
  }

  return {
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected server error.',
  }
}

export function withApiErrorHandling(
  handler: (request: VercelRequest, response: VercelResponse) => Promise<void>,
) {
  return async function safeHandler(
    request: VercelRequest,
    response: VercelResponse,
  ): Promise<void> {
    try {
      await handler(request, response)
    } catch (error) {
      const classifiedError = classifyApiError(error)

      console.error('API request failed', {
        code: classifiedError.code,
        method: request.method,
        url: request.url,
        error,
      })

      if (!response.headersSent) {
        sendJson(response, classifiedError.status, {
          error: classifiedError.message,
          code: classifiedError.code,
        })
      }
    }
  }
}
