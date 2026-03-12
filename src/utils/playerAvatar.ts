const avatarCatalog = [
  {
    label: 'Pawn',
    background: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    symbol: 'P',
    text: 'text-emerald-600',
  },
  {
    label: 'Knight',
    background: 'bg-orange-50',
    ring: 'ring-orange-200',
    symbol: 'N',
    text: 'text-orange-600',
  },
  {
    label: 'Rook',
    background: 'bg-violet-50',
    ring: 'ring-violet-200',
    symbol: 'R',
    text: 'text-violet-600',
  },
  {
    label: 'Bishop',
    background: 'bg-sky-50',
    ring: 'ring-sky-200',
    symbol: 'B',
    text: 'text-sky-600',
  },
  {
    label: 'King',
    background: 'bg-amber-50',
    ring: 'ring-amber-200',
    symbol: 'K',
    text: 'text-amber-600',
  },
  {
    label: 'Queen',
    background: 'bg-rose-50',
    ring: 'ring-rose-200',
    symbol: 'Q',
    text: 'text-rose-600',
  },
]

export function getAvatarForSeed(seed: number) {
  return avatarCatalog[(seed - 1) % avatarCatalog.length]
}
