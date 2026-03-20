export type AvatarIcon = 'bishop' | 'king' | 'knight' | 'pawn' | 'queen' | 'rook'

interface AvatarPalette {
  name: string
  backgroundColor: string
  borderColor: string
}

export interface AvatarConfig {
  label: string
  icon: AvatarIcon
  backgroundColor: string
  borderColor: string
}

const avatarIcons: Array<{ icon: AvatarIcon; label: string }> = [
  { icon: 'pawn', label: 'Pawn' },
  { icon: 'knight', label: 'Knight' },
  { icon: 'bishop', label: 'Bishop' },
  { icon: 'rook', label: 'Rook' },
  { icon: 'queen', label: 'Queen' },
  { icon: 'king', label: 'King' },
]

const avatarPalettes: AvatarPalette[] = [
  { name: 'Aqua', backgroundColor: '#DFF6F8', borderColor: '#76D2DB' },
  { name: 'Coral', backgroundColor: '#F8DBDB', borderColor: '#DA4848' },
  { name: 'Plum', backgroundColor: '#E6DDF0', borderColor: '#36064D' },
  { name: 'Gold', backgroundColor: '#F6ECD0', borderColor: '#C6A339' },
  { name: 'Moss', backgroundColor: '#E5F1DD', borderColor: '#5A8E3E' },
  { name: 'Navy', backgroundColor: '#DCE8F5', borderColor: '#2F5B8C' },
  { name: 'Terracotta', backgroundColor: '#F5E0D6', borderColor: '#B96334' },
  { name: 'Raspberry', backgroundColor: '#F4DCE7', borderColor: '#AD3D6E' },
  { name: 'Teal', backgroundColor: '#D9EFEE', borderColor: '#2B7C7A' },
  { name: 'Slate', backgroundColor: '#E1E6EC', borderColor: '#556274' },
]

const AVATAR_DISTRIBUTION_STEP = 11

export const UNIQUE_AVATAR_COMBINATION_COUNT = avatarIcons.length * avatarPalettes.length

export function getAvatarForSeed(seed: number): AvatarConfig {
  const normalizedSeed = Math.max(seed, 1)
  const combinationIndex =
    ((normalizedSeed - 1) * AVATAR_DISTRIBUTION_STEP) % UNIQUE_AVATAR_COMBINATION_COUNT
  const paletteIndex = combinationIndex % avatarPalettes.length
  const iconIndex = Math.floor(combinationIndex / avatarPalettes.length)
  const palette = avatarPalettes[paletteIndex]
  const avatar = avatarIcons[iconIndex]

  return {
    label: `${avatar.label} ${palette.name}`,
    icon: avatar.icon,
    backgroundColor: palette.backgroundColor,
    borderColor: palette.borderColor,
  }
}
