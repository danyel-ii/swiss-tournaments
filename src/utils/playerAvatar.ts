const avatarCatalog = [
  {
    label: 'Pawn',
    background: 'bg-[#d7f3f6]',
    ring: 'ring-[#76D2DB]',
    symbol: 'P',
    text: 'text-[#36064D]',
  },
  {
    label: 'Knight',
    background: 'bg-[#f6d1d1]',
    ring: 'ring-[#DA4848]',
    symbol: 'N',
    text: 'text-[#DA4848]',
  },
  {
    label: 'Rook',
    background: 'bg-[#e4daf0]',
    ring: 'ring-[#36064D]',
    symbol: 'R',
    text: 'text-[#36064D]',
  },
  {
    label: 'Bishop',
    background: 'bg-[#f7f6e5]',
    ring: 'ring-[#76D2DB]',
    symbol: 'B',
    text: 'text-[#36064D]',
  },
  {
    label: 'King',
    background: 'bg-[#f7f6e5]',
    ring: 'ring-[#DA4848]',
    symbol: 'K',
    text: 'text-[#DA4848]',
  },
  {
    label: 'Queen',
    background: 'bg-[#d7f3f6]',
    ring: 'ring-[#36064D]',
    symbol: 'Q',
    text: 'text-[#36064D]',
  },
]

export function getAvatarForSeed(seed: number) {
  return avatarCatalog[(seed - 1) % avatarCatalog.length]
}
