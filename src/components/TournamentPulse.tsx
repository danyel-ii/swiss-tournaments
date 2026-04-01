import type { ReactNode } from 'react'
import { CrownIcon, HourglassIcon, PawnIcon } from './GamePieces'
import { HelpTooltip } from './HelpTooltip'
import { formatScore } from '../utils/format'
import { useI18n } from '../useI18n'

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
  iconShellClassName: string
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
  iconShellClassName,
  icon,
  leader,
  help,
}: StatCardProps) {
  return (
    <div className={`theme-panel min-w-0 rounded-3xl p-6 ${shellClassName}`}>
      <div className="flex items-center gap-2">
        <span className={`rounded-2xl p-2 ${iconShellClassName}`}>
          {icon}
        </span>
        <p className="theme-copy font-display text-[11px] font-semibold uppercase tracking-[0.24em]">
          {eyebrow}
        </p>
        {help ? (
          <HelpTooltip label={help.label} title={help.title}>
            {help.body}
          </HelpTooltip>
        ) : null}
      </div>
      <div className="relative mt-5 min-w-0">
        {leader ? (
          <span className="absolute -top-4 left-1">
            <CrownIcon className="h-4 w-4" />
          </span>
        ) : null}
        <p className="theme-heading break-words font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl md:text-5xl">
          {value}
        </p>
      </div>
      <p className="theme-copy font-data mt-2 text-sm">{detail}</p>
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
  const { t } = useI18n()

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <StatCard
        eyebrow={t.pulse.currentRound}
        value={currentRound > 0 ? `${currentRound}` : t.pulse.setupValue}
        detail={
          currentRound > 0
            ? t.pulse.roundOf(currentRound, totalRounds)
            : t.pulse.configureRounds(totalRounds)
        }
        shellClassName=""
        iconShellClassName="bg-[var(--color-icon-round-bg)] text-[var(--color-icon-round-fg)]"
        icon={<HourglassIcon className="h-5 w-5" />}
        help={{
          label: t.pulse.currentRoundHelpLabel,
          title: t.pulse.currentRoundHelpTitle,
          body: t.pulse.currentRoundHelpBody,
        }}
      />
      <StatCard
        eyebrow={t.pulse.activeMatches}
        value={`${activeMatches}`}
        detail={t.pulse.boardsOnDesk}
        shellClassName=""
        iconShellClassName="bg-[var(--color-icon-match-bg)] text-[var(--color-icon-match-fg)]"
        icon={<span className="flex items-center"><PawnIcon className="h-5 w-5" /><PawnIcon className="-ml-1 h-5 w-5" /></span>}
        help={{
          label: t.pulse.activeMatchesHelpLabel,
          title: t.pulse.activeMatchesHelpTitle,
          body: t.pulse.activeMatchesHelpBody,
        }}
      />
      <StatCard
        eyebrow={t.pulse.leader}
        value={leader}
        detail={t.pulse.topScore(formatScore(leaderScore))}
        shellClassName=""
        iconShellClassName="bg-[var(--color-icon-leader-bg)] text-[var(--color-icon-leader-fg)]"
        icon={<CrownIcon className="h-5 w-5" />}
        leader
        help={{
          label: t.pulse.leaderHelpLabel,
          title: t.pulse.leaderHelpTitle,
          body: t.pulse.leaderHelpBody,
        }}
      />
    </section>
  )
}
