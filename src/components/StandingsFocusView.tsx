import { AvatarBadge } from './GamePieces'
import { useI18n } from '../i18n'
import { formatScore } from '../utils/format'
import type { PlayerStanding } from '../types/tournament'

interface StandingsFocusViewProps {
  standings: PlayerStanding[]
  currentRound: number
  totalRounds: number
}

export function StandingsFocusView({
  standings,
  currentRound,
  totalRounds,
}: StandingsFocusViewProps) {
  const { t } = useI18n()
  const leader = standings[0]

  return (
    <section className="theme-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-4 border-b border-[rgba(54,6,77,0.12)] pb-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--theme-text-soft)]">
              {t.standings.focusRound(currentRound, totalRounds)}
            </p>
            <h2 className="theme-heading mt-2 font-display text-4xl font-bold tracking-[-0.04em] md:text-5xl">
              {t.standings.focusTitle}
            </h2>
            <p className="theme-copy mt-2 font-data text-base">
              {t.standings.focusSubtitle}
            </p>
          </div>

          {leader ? (
            <div className="rounded-3xl bg-[var(--theme-plum)] px-5 py-4 text-[var(--theme-cream)]">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] opacity-70">
                {t.pulse.leader}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">{leader.name}</p>
              <p className="mt-1 font-data text-sm opacity-80">
                {t.standings.focusLeader(leader.name, formatScore(leader.score))}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {standings.length === 0 ? (
        <div className="flex min-h-[18rem] items-center justify-center">
          <p className="theme-copy font-data text-lg">{t.standings.focusEmpty}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {standings.map((standing) => (
            <article
              key={standing.playerId}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-3xl px-5 py-4 ${
                standing.rank === 1
                  ? 'bg-[var(--theme-plum)] text-[var(--theme-cream)]'
                  : 'theme-muted-panel'
              }`}
            >
              <div className="flex min-w-[4rem] items-center gap-3">
                <span
                  className={`font-display text-2xl font-bold tracking-[-0.04em] ${
                    standing.rank === 1 ? 'text-[var(--theme-cream)]' : 'text-[var(--theme-text)]'
                  }`}
                >
                  {standing.rank}
                </span>
                <AvatarBadge seed={standing.seed} />
              </div>

              <div className="min-w-0">
                <h3
                  className={`truncate font-display text-2xl font-semibold md:text-3xl ${
                    standing.rank === 1 ? 'text-[var(--theme-cream)]' : 'theme-heading'
                  }`}
                >
                  {standing.name}
                </h3>
                <p
                  className={`font-data text-sm md:text-base ${
                    standing.rank === 1 ? 'text-[rgba(247,246,229,0.76)]' : 'theme-copy'
                  }`}
                >
                  {t.standings.seed} {standing.seed} · {t.standings.buchholz} {formatScore(standing.buchholz)}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`font-display text-3xl font-bold tracking-[-0.05em] md:text-5xl ${
                    standing.rank === 1 ? 'text-[var(--theme-aqua)]' : 'text-[var(--theme-red)]'
                  }`}
                >
                  {formatScore(standing.score)}
                </p>
                <p
                  className={`font-display text-[11px] font-semibold uppercase tracking-[0.24em] ${
                    standing.rank === 1 ? 'text-[rgba(247,246,229,0.7)]' : 'text-[var(--theme-text-soft)]'
                  }`}
                >
                  {t.standings.score}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
