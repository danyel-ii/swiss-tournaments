export const ALLOWED_USERNAMES = ['kusselberg', 'schachmagie', 'daniel'] as const

export type AllowedUsername = (typeof ALLOWED_USERNAMES)[number]

const PASSWORD_HASH_ENV_BY_USERNAME: Record<AllowedUsername, string> = {
  kusselberg: 'AUTH_KUSSELBERG_PASSWORD_HASH',
  schachmagie: 'AUTH_SCHACHMAGIE_PASSWORD_HASH',
  daniel: 'AUTH_DANIEL_PASSWORD_HASH',
}

export function isAllowedUsername(value: string): value is AllowedUsername {
  return ALLOWED_USERNAMES.includes(value as AllowedUsername)
}

export function getPasswordHashForUsername(username: string): string | null {
  if (!isAllowedUsername(username)) {
    return null
  }

  return process.env[PASSWORD_HASH_ENV_BY_USERNAME[username]] ?? null
}
