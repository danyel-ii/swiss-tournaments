import { getAvatarForSeed } from '../utils/playerAvatar'

interface IconProps {
  className?: string
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
  const imageInsetClass = size === 'sm' ? 'inset-[3px]' : 'inset-[4px]'

  return (
    <span
      className={`relative inline-flex ${sizeClass} items-center justify-center rounded-full ${avatar.background} ring-2 ${avatar.ring} shadow-[0_4px_10px_rgba(15,23,42,0.08)]`}
      title={avatar.label}
      aria-label={avatar.label}
    >
      <span
        className={`absolute ${imageInsetClass} rounded-full bg-[url('/image.png')] bg-[length:300%_200%] bg-no-repeat`}
        style={{ backgroundPosition: avatar.spritePosition }}
        aria-hidden="true"
      />
    </span>
  )
}

export function CrownIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 18h16l-1.6-8-4.2 3-2.2-6-2.2 6-4.2-3L4 18Z"
        className="fill-amber-300 stroke-amber-500"
        strokeWidth="1.4"
      />
      <path d="M5.5 20h13" className="stroke-amber-500" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function CrystalIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3 5 8l2.5 10h9L19 8l-7-5Z"
        className="fill-sky-200 stroke-sky-500"
        strokeWidth="1.4"
      />
      <path d="M8.5 8h7M12 3v15" className="stroke-sky-50" strokeWidth="1.4" />
    </svg>
  )
}

export function ScrollIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 5h10a3 3 0 1 1 0 6H9a3 3 0 1 0 0 6h9"
        className="stroke-amber-800"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M6 5v14" className="stroke-amber-700" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function PawnIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="7" r="3" className="fill-slate-100 stroke-slate-700" strokeWidth="1.4" />
      <path
        d="M9 18h6l-1.2-4.5a3 3 0 1 0-3.6 0L9 18Z"
        className="fill-slate-100 stroke-slate-700"
        strokeWidth="1.4"
      />
      <path d="M8 20h8" className="stroke-slate-700" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function HourglassIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 4h8M8 20h8" className="stroke-sky-500" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M8 4c0 4 4 4 4 8s-4 4-4 8m8-16c0 4-4 4-4 8s4 4 4 8"
        className="stroke-sky-500"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function FlagIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 4v16" className="stroke-violet-900" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7 5h9l-2.3 3L16 11H7V5Z"
        className="fill-violet-300 stroke-violet-800"
        strokeWidth="1.4"
      />
    </svg>
  )
}

export function ShieldIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 4 6 6.5V12c0 4.1 2.4 6.8 6 8 3.6-1.2 6-3.9 6-8V6.5L12 4Z"
        className="fill-teal-200 stroke-teal-800"
        strokeWidth="1.4"
      />
    </svg>
  )
}
