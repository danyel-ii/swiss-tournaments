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
    <section className="rounded-[32px] border border-[#2f6f66]/18 bg-[linear-gradient(180deg,_#f4e6bf_0%,_#e4cf92_100%)] p-6 shadow-[inset_0_2px_0_rgba(255,255,255,0.65),0_16px_28px_rgba(100,83,45,0.15)]">
      {isCompleted ? (
        <div className="font-display rounded-2xl bg-emerald-100 px-4 py-4 text-sm font-medium text-emerald-800">
          Tournament complete. Final standings are locked after round {totalRounds}.
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#26515c]">Command Move</h2>
            <p className="font-data mt-1 text-sm text-[#5f6c64]">
              {currentRound === 0
                ? 'Start the tournament to generate round 1.'
                : 'Generate the next round only after all current results are entered.'}
            </p>
          </div>

          <button
            type="button"
            disabled={!canGenerateNextRound}
            onClick={onGenerateNextRound}
            className="font-display rounded-[22px] border border-emerald-800/20 bg-[linear-gradient(180deg,_#74d38e_0%,_#45a85f_100%)] px-5 py-3 text-sm font-bold text-emerald-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_18px_rgba(24,105,54,0.18)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-200"
          >
            {currentRound >= totalRounds ? 'Final Round Complete' : 'Generate Next Round'}
          </button>
        </div>
      )}
    </section>
  )
}
