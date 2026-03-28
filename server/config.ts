export const ALLOWED_USERNAMES = ['kusselberg', 'schachmagie', 'danyel-ii'] as const

export type AllowedUsername = (typeof ALLOWED_USERNAMES)[number]

const PASSWORD_HASH_ENVS_BY_USERNAME: Record<AllowedUsername, string[]> = {
  kusselberg: ['AUTH_KUSSELBERG_PASSWORD_HASH'],
  schachmagie: ['AUTH_SCHACHMAGIE_PASSWORD_HASH'],
  'danyel-ii': ['AUTH_DANYEL_II_PASSWORD_HASH', 'AUTH_DANIEL_PASSWORD_HASH'],
}

export function isAllowedUsername(value: string): value is AllowedUsername {
  return ALLOWED_USERNAMES.includes(value as AllowedUsername)
}

export function getPasswordHashForUsername(username: string): string | null {
  if (!isAllowedUsername(username)) {
    return null
  }

  const envNames = PASSWORD_HASH_ENVS_BY_USERNAME[username]

  for (const envName of envNames) {
    const value = process.env[envName]

    if (value) {
      return value
    }
  }

  return null
}
