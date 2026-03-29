import type { PlayerStatsDetail, PlayerStatsSummary } from '../types/library'
import { formatDateTime, formatPercent, formatScore, slugifyFileName } from './format'

function buildSummarySection(detail: PlayerStatsDetail): string {
  const summary = detail.summary

  return [
    '## Summary',
    '',
    `- Player: ${summary.name}`,
    `- Tournaments: ${summary.tournamentsPlayed}`,
    `- Games: ${summary.gamesPlayed}`,
    `- Score: ${formatScore(summary.totalScore)}`,
    `- Score percentage: ${formatPercent(summary.scorePercentage)}`,
    `- Wins / Draws / Losses: ${summary.wins} / ${summary.draws} / ${summary.losses}`,
    `- Win rate: ${formatPercent(summary.winRate)}`,
    `- Win rate as White: ${formatPercent(summary.winRateAsWhite)}`,
    `- Win rate as Black: ${formatPercent(summary.winRateAsBlack)}`,
    `- Byes: ${summary.byes}`,
    `- White / Black games: ${summary.whiteGames} / ${summary.blackGames}`,
    `- Color imbalance: ${summary.colorImbalance}`,
    `- Average Buchholz: ${formatScore(summary.averageBuchholz)}`,
    `- Best Buchholz: ${formatScore(summary.bestBuchholz)}`,
    `- Latest Buchholz: ${summary.latestBuchholz === null ? '—' : formatScore(summary.latestBuchholz)}`,
    `- Completed / Partial tournaments: ${summary.completedTournaments} / ${summary.partialTournaments}`,
    `- Undefeated tournaments: ${summary.undefeatedTournaments}`,
    `- Late entries: ${summary.lateEntries}`,
    `- Dropouts: ${summary.dropouts}`,
    `- Longest White streak: ${summary.longestWhiteStreak}`,
    `- Longest Black streak: ${summary.longestBlackStreak}`,
    `- Last played: ${summary.lastPlayedAt ? formatDateTime(summary.lastPlayedAt) : '—'}`,
    '',
  ].join('\n')
}

function buildTournamentHistorySection(detail: PlayerStatsDetail): string {
  if (detail.tournaments.length === 0) {
    return ['## Tournament History', '', 'No tournament history available.', ''].join('\n')
  }

  const sections = detail.tournaments.map((tournament) =>
    [
      `### ${tournament.tournamentName}`,
      '',
      `- Updated: ${formatDateTime(tournament.updatedAt)}`,
      `- Status: ${tournament.status}`,
      `- Placement: ${tournament.finalRank} / ${tournament.playerCount}`,
      `- Seed to place: ${tournament.seed} -> ${tournament.finalRank}`,
      `- Score: ${formatScore(tournament.score)}`,
      `- Score percentage: ${formatPercent(tournament.scorePercentage)}`,
      `- Buchholz: ${formatScore(tournament.buchholz)}`,
      `- White / Black games: ${tournament.whiteGames} / ${tournament.blackGames}`,
      `- Entered / Dropped: ${tournament.enteredRound} / ${tournament.droppedAfterRound ?? '—'}`,
      `- Undefeated: ${tournament.undefeated ? 'Yes' : 'No'}`,
      '',
      '#### Round Progression',
      '',
      ...(
        tournament.rounds.length > 0
          ? tournament.rounds.map(
              (round) =>
                `- Round ${round.round}: score ${formatScore(round.score)}, Buchholz ${formatScore(round.buchholz)}, rank #${round.rank}`,
            )
          : ['- No round progression available.']
      ),
      '',
      '#### Opponents',
      '',
      ...(
        tournament.opponents.length > 0
          ? tournament.opponents.map(
              (opponent) =>
                `- Round ${opponent.round}, Board ${opponent.board}: ${opponent.color ?? '—'} vs ${opponent.opponentName} -> ${opponent.result ?? 'Pending'} (${formatScore(opponent.points)} pts)`,
            )
          : ['- No opponents recorded.']
      ),
      '',
    ].join('\n'),
  )

  return ['## Tournament History', '', ...sections].join('\n')
}

function buildByeHistorySection(detail: PlayerStatsDetail): string {
  return [
    '## Bye History',
    '',
    ...(
      detail.byeHistory.length > 0
        ? detail.byeHistory.map(
            (entry) => `- ${entry.tournamentName} · Round ${entry.round} · ${formatDateTime(entry.updatedAt)}`,
          )
        : ['- No byes recorded.']
    ),
    '',
  ].join('\n')
}

export function buildPlayerStatsMarkdown(detail: PlayerStatsDetail): string {
  return [
    `# Player Statistics: ${detail.summary.name}`,
    '',
    buildSummarySection(detail),
    buildTournamentHistorySection(detail),
    buildByeHistorySection(detail),
  ].join('\n')
}

export function buildAllPlayerStatsMarkdown(details: PlayerStatsDetail[]): string {
  return [
    '# All Player Statistics',
    '',
    ...details.map((detail) => buildPlayerStatsMarkdown(detail)),
  ].join('\n')
}

function downloadMarkdown(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

export function downloadPlayerStats(detail: PlayerStatsDetail): void {
  downloadMarkdown(
    buildPlayerStatsMarkdown(detail),
    `${slugifyFileName(detail.summary.name)}-stats.md`,
  )
}

export function downloadAllPlayerStats(details: PlayerStatsDetail[]): void {
  downloadMarkdown(
    buildAllPlayerStatsMarkdown(details),
    'all-player-stats.md',
  )
}

export async function loadAllPlayerStatsDetails(
  players: PlayerStatsSummary[],
  loadDetail: (playerId: string) => Promise<PlayerStatsDetail>,
): Promise<PlayerStatsDetail[]> {
  return Promise.all(players.map((player) => loadDetail(player.playerId)))
}
