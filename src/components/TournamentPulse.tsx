import type { ReactNode } from 'react'
import { CrownIcon, HourglassIcon, PawnIcon } from './GamePieces'
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
    <div className={`rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${shellClassName}`}>
      <div className="flex items-center gap-2">
        <span className="rounded-2xl bg-sky-50 p-2 text-sky-500">
          {icon}
        </span>
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
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
          <span className="absolute -top-4 left-1">
            <CrownIcon className="h-4 w-4" />
          </span>
        ) : null}
      <p className="font-display text-4xl font-bold tracking-[-0.04em] text-slate-900 md:text-5xl">
        {value}
      </p>
      </div>
      <p className="font-data mt-2 text-sm text-slate-500">{detail}</p>
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
        shellClassName=""
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
        shellClassName=""
        icon={<span className="flex items-center"><PawnIcon className="h-5 w-5" /><PawnIcon className="-ml-1 h-5 w-5" /></span>}
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
        shellClassName=""
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
