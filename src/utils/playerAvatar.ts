const avatarCatalog = [
  {
    label: 'Mint Pawn',
    background: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    spritePosition: '0% 0%',
  },
  {
    label: 'Peach Knight',
    background: 'bg-orange-50',
    ring: 'ring-orange-200',
    spritePosition: '50% 0%',
  },
  {
    label: 'Lavender Rook',
    background: 'bg-violet-50',
    ring: 'ring-violet-200',
    spritePosition: '100% 0%',
  },
  {
    label: 'Sky Bishop',
    background: 'bg-sky-50',
    ring: 'ring-sky-200',
    spritePosition: '0% 100%',
  },
  {
    label: 'Gold King',
    background: 'bg-amber-50',
    ring: 'ring-amber-200',
    spritePosition: '50% 100%',
  },
  {
    label: 'Pink Pawn',
    background: 'bg-rose-50',
    ring: 'ring-rose-200',
    spritePosition: '100% 100%',
  },
]

export function getAvatarForSeed(seed: number) {
  return avatarCatalog[(seed - 1) % avatarCatalog.length]
}
