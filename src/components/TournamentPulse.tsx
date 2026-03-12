import type { ReactNode } from 'react'
import { CrownIcon, FlagIcon, HourglassIcon } from './GamePieces'
import { HelpTooltip } from './HelpTooltip'
import { formatScore } from '../utils/format'

interface TournamentPulseProps {
  currentRound: number
  totalRounds: number
  activeMatches: number
  leader: string
  leaderScore: number
}

interface StatCardProps {
  eyebrow: string
  value: string
  detail: string
  shellClassName: string
  icon: ReactNode
  leader?: boolean
  help?: {
    label: string
    title: string
    body: string
  }
}

function StatCard({
  eyebrow,
  value,
  detail,
  shellClassName,
  icon,
  leader,
  help,
}: StatCardProps) {
  return (
    <div className={`relative overflow-hidden p-6 ${shellClassName}`}>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/35 p-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.45)]">
          {icon}
        </span>
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-700">
          {eyebrow}
        </p>
        {help ? (
          <HelpTooltip label={help.label} title={help.title}>
            {help.body}
          </HelpTooltip>
        ) : null}
      </div>
      <div className="relative mt-5">
        {leader ? (
          <span className="absolute -top-5 left-1">
            <CrownIcon className="h-5 w-5" />
          </span>
        ) : null}
      <p className="font-display text-4xl font-extrabold tracking-[-0.04em] text-slate-950 md:text-5xl">
        {value}
      </p>
      </div>
      <p className="font-data mt-2 text-sm text-slate-700">{detail}</p>
    </div>
  )
}

export function TournamentPulse({
  currentRound,
  totalRounds,
  activeMatches,
  leader,
  leaderScore,
}: TournamentPulseProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <StatCard
        eyebrow="Current Round"
        value={currentRound > 0 ? `${currentRound}` : 'Setup'}
        detail={
          currentRound > 0
            ? `Round ${currentRound} of ${totalRounds}`
            : `Configure up to ${totalRounds} rounds`
        }
        shellClassName="[clip-path:polygon(25%_0%,75%_0%,100%_35%,100%_65%,75%_100%,25%_100%,0%_65%,0%_35%)] rounded-[32px] border border-emerald-700/15 bg-[linear-gradient(180deg,_#a7e2b0_0%,_#5fc878_100%)] shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_16px_28px_rgba(21,78,47,0.18)]"
        icon={<HourglassIcon className="h-5 w-5" />}
        help={{
          label: 'How current round works',
          title: 'Current Round',
          body:
            'This is the active live round. Pairings, standings, and next-round availability all use this round as the tournament desk state.',
        }}
      />
      <StatCard
        eyebrow="Active Matches"
        value={`${activeMatches}`}
        detail="Boards currently on the desk"
        shellClassName="[clip-path:polygon(25%_0%,75%_0%,100%_35%,100%_65%,75%_100%,25%_100%,0%_65%,0%_35%)] rounded-[32px] border border-violet-700/15 bg-[linear-gradient(180deg,_#d0b7f8_0%,_#9a7bd9_100%)] shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_16px_28px_rgba(91,57,147,0.18)]"
        icon={<FlagIcon className="h-5 w-5" />}
        help={{
          label: 'How active matches are counted',
          title: 'Active Matches',
          body:
            'This counts non-bye pairings in the current live round. A bye is completed automatically and does not count as an active board.',
        }}
      />
      <StatCard
        eyebrow="Leader"
        value={leader}
        detail={`Top score ${formatScore(leaderScore)}`}
        shellClassName="[clip-path:polygon(25%_0%,75%_0%,100%_35%,100%_65%,75%_100%,25%_100%,0%_65%,0%_35%)] rounded-[32px] border border-amber-700/15 bg-[linear-gradient(180deg,_#f3dd95_0%,_#ddb24a_100%)] shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_16px_28px_rgba(133,96,21,0.18)]"
        icon={<CrownIcon className="h-5 w-5" />}
        leader
        help={{
          label: 'How leader is chosen',
          title: 'Leader',
          body:
            'The leader is the current first-place player after applying the standings sort order: score, then Buchholz, then seed.',
        }}
      />
    </section>
  )
}
