import type { CSSProperties } from 'react'
import { getAvatarForSeed } from '../utils/playerAvatar'
import checkedShieldIcon from '../assets/game-icons/checked-shield.svg'
import crownIcon from '../assets/game-icons/crown.svg'
import hourglassIcon from '../assets/game-icons/hourglass.svg'
import pawnIcon from '../assets/game-icons/pawn.svg'

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

export function AvatarBadge({
  seed,
  size = 'md',
}: {
  seed: number
  size?: 'sm' | 'md'
}) {
  const avatar = getAvatarForSeed(seed)
  const sizeClass = size === 'sm' ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-base'

  return (
    <span
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full ${avatar.background} ring-2 ${avatar.ring} ${avatar.text} font-display font-bold shadow-[0_4px_10px_rgba(15,23,42,0.08)]`}
      title={avatar.label}
      aria-label={avatar.label}
    >
      {avatar.symbol}
    </span>
  )
}

export function CrownIcon({ className = 'h-6 w-6' }: IconProps) {
  return <MaskedIcon assetUrl={crownIcon} className={className} />
}

export function PawnIcon({ className = 'h-5 w-5' }: IconProps) {
  return <MaskedIcon assetUrl={pawnIcon} className={className} />
}

export function HourglassIcon({ className = 'h-5 w-5' }: IconProps) {
  return <MaskedIcon assetUrl={hourglassIcon} className={className} />
}

export function ShieldIcon({ className = 'h-5 w-5' }: IconProps) {
  return <MaskedIcon assetUrl={checkedShieldIcon} className={className} />
}
