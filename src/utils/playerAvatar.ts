type AvatarIcon = 'bishop' | 'king' | 'knight' | 'pawn' | 'queen' | 'rook'

interface AvatarConfig {
  label: string
  icon: AvatarIcon
  background: string
  ring: string
  text: string
}

const avatarCatalog: AvatarConfig[] = [
  {
    label: 'Pawn',
    icon: 'pawn',
    background: 'bg-[#d7f3f6]',
    ring: 'ring-[#76D2DB]',
    text: 'text-[#36064D]',
  },
  {
    label: 'Knight',
    icon: 'knight',
    background: 'bg-[#f6d1d1]',
    ring: 'ring-[#DA4848]',
    text: 'text-[#DA4848]',
  },
  {
    label: 'Bishop',
    icon: 'bishop',
    background: 'bg-[#e4daf0]',
    ring: 'ring-[#36064D]',
    text: 'text-[#36064D]',
  },
  {
    label: 'Rook',
    icon: 'rook',
    background: 'bg-[#f7f6e5]',
    ring: 'ring-[#76D2DB]',
    text: 'text-[#36064D]',
  },
  {
    label: 'Queen',
    icon: 'queen',
    background: 'bg-[#f7f6e5]',
    ring: 'ring-[#DA4848]',
    text: 'text-[#DA4848]',
  },
  {
    label: 'King',
    icon: 'king',
    background: 'bg-[#d7f3f6]',
    ring: 'ring-[#36064D]',
    text: 'text-[#36064D]',
  },
]

export function getAvatarForSeed(seed: number) {
  return avatarCatalog[(seed - 1) % avatarCatalog.length]
}
