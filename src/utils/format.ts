export function formatScore(score: number): string {
  return Number.isInteger(score) ? `${score}.0` : score.toFixed(1)
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString()
}

export function slugifyFileName(value: string): string {
  const trimmed = value.trim().toLowerCase()

  if (!trimmed) {
    return 'tournament'
  }

  return trimmed
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
