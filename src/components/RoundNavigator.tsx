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
    <section className="rounded-[30px] border border-[#2f6f66]/18 bg-[linear-gradient(180deg,_#edf0d7_0%,_#d7e0b4_100%)] p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.7),0_14px_28px_rgba(21,58,54,0.14)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-[#2a5660]">Round Archive</h2>
          <p className="font-data text-sm text-[#48635b]">
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
                className={`font-display rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] shadow-[inset_0_2px_0_rgba(255,255,255,0.55)] transition ${
                  isSelected
                    ? 'border-sky-400/55 bg-[linear-gradient(180deg,_#8dc8ff_0%,_#68abef_100%)] text-sky-950'
                    : isCurrent
                      ? 'border-emerald-400/55 bg-[linear-gradient(180deg,_#b5efbb_0%,_#7bcf83_100%)] text-emerald-950 animate-pulse'
                      : 'border-[#94a287] bg-[linear-gradient(180deg,_#f2ebdc_0%,_#d1cab9_100%)] text-[#5f645d] hover:border-[#708b7e] hover:text-[#32514d]'
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
