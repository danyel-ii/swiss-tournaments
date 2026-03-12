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
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-4 shadow-[0_12px_50px_rgba(2,6,23,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-sans text-lg font-bold text-white">Round Archive</h2>
          <p className="text-sm text-slate-300">
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
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] transition ${
                  isSelected
                    ? 'border-cyan-300 bg-cyan-400/20 text-cyan-100'
                    : 'border-white/10 bg-slate-950/30 text-slate-300 hover:border-white/25 hover:text-white'
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
