const avatarCatalog = [
  { code: 'KN', label: 'Knight', bg: 'bg-sky-200', ring: 'ring-sky-500/50', text: 'text-sky-900' },
  { code: 'PW', label: 'Pawn', bg: 'bg-emerald-200', ring: 'ring-emerald-500/45', text: 'text-emerald-950' },
  { code: 'RK', label: 'Rook', bg: 'bg-amber-200', ring: 'ring-amber-500/45', text: 'text-amber-950' },
  { code: 'OW', label: 'Owl', bg: 'bg-fuchsia-200', ring: 'ring-fuchsia-500/40', text: 'text-fuchsia-950' },
  { code: 'LN', label: 'Lion', bg: 'bg-rose-200', ring: 'ring-rose-500/40', text: 'text-rose-950' },
]

export function getAvatarForSeed(seed: number) {
  return avatarCatalog[(seed - 1) % avatarCatalog.length]
}
