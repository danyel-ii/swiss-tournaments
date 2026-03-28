import type { VercelRequest, VercelResponse } from '@vercel/node'

export function sendJson(
  response: VercelResponse,
  status: number,
  payload: unknown,
): void {
  response.status(status).json(payload)
}

export function sendMethodNotAllowed(
  response: VercelResponse,
  allowedMethods: string[],
): void {
  response.setHeader('Allow', allowedMethods.join(', '))
  sendJson(response, 405, { error: 'Method not allowed' })
}

export function parseJsonBody<T>(request: VercelRequest): T | null {
  if (!request.body) {
    return null
  }

  if (typeof request.body === 'string') {
    return JSON.parse(request.body) as T
  }

  return request.body as T
}

export function setNoStore(response: VercelResponse): void {
  response.setHeader('Cache-Control', 'no-store')
}
