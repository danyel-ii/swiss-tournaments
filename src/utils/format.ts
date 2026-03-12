export function formatScore(score: number): string {
  return Number.isInteger(score) ? `${score}.0` : score.toFixed(1)
}

export function formatStatusLabel(
  status: 'setup' | 'in_progress' | 'completed',
  currentRound: number,
  totalRounds: number,
): string {
  if (status === 'setup') {
    return 'Setup'
  }

  if (status === 'completed') {
    return 'Completed'
  }

  return `Round ${currentRound} of ${totalRounds}`
}
