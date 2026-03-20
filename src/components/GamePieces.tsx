import type { CSSProperties } from 'react'
import { getAvatarForSeed } from '../utils/playerAvatar'
import bishopIcon from '../assets/game-icons/chess/chess-bishop.svg'
import kingIcon from '../assets/game-icons/chess/chess-king.svg'
import knightIcon from '../assets/game-icons/chess/chess-knight.svg'
import pawnIcon from '../assets/game-icons/chess/chess-pawn.svg'
import queenIcon from '../assets/game-icons/chess/chess-queen.svg'
import rookIcon from '../assets/game-icons/chess/chess-rook.svg'

interface IconProps {
  className?: string
}

function maskStyle(assetUrl: string, color = 'currentColor'): CSSProperties {
  return {
    backgroundColor: color,
    WebkitMaskImage: `url(${assetUrl})`,
    maskImage: `url(${assetUrl})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  }
}

function MaskedIcon({
  assetUrl,
  className = 'h-5 w-5',
  color,
}: {
  assetUrl: string
  className?: string
  color?: string
}) {
  return <span className={`inline-block shrink-0 ${className}`} style={maskStyle(assetUrl, color)} aria-hidden="true" />
}

function getAvatarIcon(icon: 'bishop' | 'king' | 'knight' | 'pawn' | 'queen' | 'rook') {
  switch (icon) {
    case 'bishop':
      return bishopIcon
    case 'king':
      return kingIcon
    case 'knight':
      return knightIcon
    case 'queen':
      return queenIcon
    case 'rook':
      return rookIcon
    case 'pawn':
    default:
      return pawnIcon
  }
}

export function AvatarBadge({
  seed,
  size = 'md',
}: {
  seed: number
  size?: 'sm' | 'md'
}) {
  const avatar = getAvatarForSeed(seed)
  const sizeClass = size === 'sm' ? 'h-9 w-9' : 'h-12 w-12'
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <span
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full ${avatar.background} ring-2 ${avatar.ring} ${avatar.text} shadow-[0_4px_10px_rgba(15,23,42,0.08)]`}
      title={avatar.label}
      aria-label={avatar.label}
    >
      <MaskedIcon assetUrl={getAvatarIcon(avatar.icon)} className={iconClass} />
    </span>
  )
}

export function CrownIcon({ className = 'h-6 w-6' }: IconProps) {
  return <MaskedIcon assetUrl={kingIcon} className={className} />
}

export function PawnIcon({ className = 'h-5 w-5' }: IconProps) {
  return <MaskedIcon assetUrl={pawnIcon} className={className} />
}

export function HourglassIcon({ className = 'h-5 w-5' }: IconProps) {
  return <MaskedIcon assetUrl={bishopIcon} className={className} />
}

export function ShieldIcon({ className = 'h-5 w-5' }: IconProps) {
  return <MaskedIcon assetUrl={knightIcon} className={className} />
}
