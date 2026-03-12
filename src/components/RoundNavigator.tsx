interface RoundNavigatorProps {
  rounds: number[]
  selectedRound: number
  currentRound: number
  onSelectRound: (round: number) => void
}

export function RoundNavigator({
  rounds,
  selectedRound,
  currentRound,
  onSelectRound,
}: RoundNavigatorProps) {
  if (rounds.length === 0) {
    return null
  }

  return (
    <section className="rounded-3xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">Round Archive</h2>
          <p className="font-data text-sm text-slate-500">
            Jump across previous pairings without changing live standings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {rounds.map((round) => {
            const isSelected = round === selectedRound
            const isCurrent = round === currentRound

            return (
              <button
                key={round}
                type="button"
                onClick={() => onSelectRound(round)}
                className={`font-display rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  isSelected
                    ? 'border-sky-200 bg-sky-100 text-sky-700'
                    : isCurrent
                      ? 'border-violet-200 bg-violet-100 text-violet-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                Round {round}
                {isCurrent ? ' Live' : ''}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
