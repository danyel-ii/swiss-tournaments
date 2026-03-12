interface ActionBarProps {
  canGenerateNextRound: boolean
  isCompleted: boolean
  currentRound: number
  totalRounds: number
  onGenerateNextRound: () => void
}

export function ActionBar({
  canGenerateNextRound,
  isCompleted,
  currentRound,
  totalRounds,
  onGenerateNextRound,
}: ActionBarProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_18px_60px_rgba(2,6,23,0.3)] backdrop-blur-xl">
      {isCompleted ? (
        <div className="rounded-2xl bg-emerald-400/12 px-4 py-4 text-sm font-medium text-emerald-200">
          Tournament complete. Final standings are locked after round {totalRounds}.
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-sans text-2xl font-bold text-white">Round actions</h2>
            <p className="mt-1 text-sm text-slate-300">
              {currentRound === 0
                ? 'Start the tournament to generate round 1.'
                : 'Generate the next round only after all current results are entered.'}
            </p>
          </div>

          <button
            type="button"
            disabled={!canGenerateNextRound}
            onClick={onGenerateNextRound}
            className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {currentRound >= totalRounds ? 'Final Round Complete' : 'Generate Next Round'}
          </button>
        </div>
      )}
    </section>
  )
}
