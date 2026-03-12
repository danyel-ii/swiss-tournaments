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
  accentClassName: string
}

function StatCard({
  eyebrow,
  value,
  detail,
  accentClassName,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.08] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      <div
        className={`absolute inset-x-6 top-0 h-px opacity-80 ${accentClassName}`}
      />
      <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-400">
        {eyebrow}
      </p>
      <p className="mt-4 font-sans text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
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
        accentClassName="bg-gradient-to-r from-cyan-400 via-sky-300 to-transparent"
      />
      <StatCard
        eyebrow="Active Matches"
        value={`${activeMatches}`}
        detail="Boards currently on the desk"
        accentClassName="bg-gradient-to-r from-fuchsia-400 via-violet-300 to-transparent"
      />
      <StatCard
        eyebrow="Leader"
        value={leader}
        detail={`Top score ${formatScore(leaderScore)}`}
        accentClassName="bg-gradient-to-r from-amber-300 via-yellow-200 to-transparent"
      />
    </section>
  )
}
