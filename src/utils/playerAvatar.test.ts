import { describe, expect, it } from 'vitest'
import { getAvatarForSeed, UNIQUE_AVATAR_COMBINATION_COUNT } from './playerAvatar'

describe('playerAvatar', () => {
  it('keeps avatar combinations unique for the first 50 seeds', () => {
    const combinations = new Set(
      Array.from({ length: 50 }, (_, index) => {
        const avatar = getAvatarForSeed(index + 1)
        return `${avatar.icon}:${avatar.borderColor}:${avatar.backgroundColor}`
      }),
    )

    expect(combinations.size).toBe(50)
  })

  it('exposes at least 50 unique combinations before repeating', () => {
    expect(UNIQUE_AVATAR_COMBINATION_COUNT).toBeGreaterThanOrEqual(50)
  })
})
