import { getPlayersEnteredByRound, getRoundMatches, getStandings } from '../core/ranking'
import type { Match, Player, Tournament } from '../types/tournament'
import { formatDateTime, formatScore, slugifyFileName } from './format'

function getPlayerName(players: Player[], playerId: string | null): string {
  if (!playerId) {
    return 'BYE'
  }

  return players.find((player) => player.id === playerId)?.name ?? 'Unknown'
}

function formatMatchResult(match: Match): string {
  return match.result ?? 'Pending'
}

function buildRegistrationSection(players: Player[]): string {
  const rows = players
    .slice()
    .sort((left, right) => left.seed - right.seed)
    .map((player) => `| ${player.seed} | ${player.name} | ${player.id} |`)
    .join('\n')

  return [
    '## Registration',
    '',
    '| Seed | Player | Player ID |',
    '| --- | --- | --- |',
    rows || '| - | - | - |',
    '',
  ].join('\n')
}

function buildStandingsSection(tournament: Tournament): string {
  const standings = getStandings(
    getPlayersEnteredByRound(tournament.players, tournament.currentRound),
    tournament.matches,
  )
  const rows = standings
    .map(
      (standing) =>
        `| ${standing.rank} | ${standing.name} | ${standing.seed} | ${formatScore(standing.score)} | ${formatScore(standing.buchholz)} | ${standing.colorHistory.join('') || '-'} | ${standing.receivedBye ? 'Yes' : 'No'} |`,
    )
    .join('\n')

  return [
    '## Standings',
    '',
    '| Rank | Player | Seed | Score | Buchholz | Colors | Bye |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    rows || '| - | - | - | - | - | - | - |',
    '',
  ].join('\n')
}

function buildPlayerDetailSection(tournament: Tournament): string {
  const standings = getStandings(
    getPlayersEnteredByRound(tournament.players, tournament.currentRound),
    tournament.matches,
  )
  const blocks = standings.map((standing) => {
    const playerMatches = tournament.matches
      .filter(
        (match) =>
          match.whitePlayerId === standing.playerId ||
          match.blackPlayerId === standing.playerId,
      )
      .sort((left, right) => {
        if (left.round !== right.round) {
          return left.round - right.round
        }

        return left.board - right.board
      })

    const matchRows =
      playerMatches.length === 0
        ? ['No pairings yet.']
        : playerMatches.map((match) => {
            const opponentId =
              match.whitePlayerId === standing.playerId
                ? match.blackPlayerId
                : match.whitePlayerId

            const side = match.isBye
              ? 'BYE'
              : match.whitePlayerId === standing.playerId
                ? 'White'
                : 'Black'

            return `- Round ${match.round}, Board ${match.board}: ${side} vs ${getPlayerName(
              tournament.players,
              opponentId,
            )} -> ${formatMatchResult(match)}`
          })

    return [
      `### ${standing.rank}. ${standing.name}`,
      '',
      `- Seed: ${standing.seed}`,
      `- Score: ${formatScore(standing.score)}`,
      `- Buchholz: ${formatScore(standing.buchholz)}`,
      `- Colors: ${standing.colorHistory.join(' ') || '-'}`,
      `- Received bye: ${standing.receivedBye ? 'Yes' : 'No'}`,
      '',
      ...matchRows,
      '',
    ].join('\n')
  })

  return ['## Player Details', '', ...blocks].join('\n')
}

function buildRoundsSection(tournament: Tournament): string {
  const rounds = Array.from(
    new Set(tournament.matches.map((match) => match.round)),
  ).sort((left, right) => left - right)

  if (rounds.length === 0) {
    return ['## Rounds', '', 'No rounds generated yet.', ''].join('\n')
  }

  const sections = rounds.map((round) => {
    const matches = getRoundMatches(tournament.matches, round)
    const rows = matches
      .map((match) => {
        return `| ${match.board} | ${getPlayerName(
          tournament.players,
          match.whitePlayerId,
        )} | ${match.isBye ? 'BYE' : getPlayerName(
          tournament.players,
          match.blackPlayerId,
        )} | ${formatMatchResult(match)} | ${match.isBye ? 'Bye' : 'Board'} |`
      })
      .join('\n')

    return [
      `### Round ${round}`,
      '',
      '| Board | White | Black | Result | Type |',
      '| --- | --- | --- | --- | --- |',
      rows || '| - | - | - | - | - |',
      '',
    ].join('\n')
  })

  return ['## Rounds', '', ...sections].join('\n')
}

export function buildTournamentExport(tournament: Tournament): string {
  return [
    `# ${tournament.name} Tournament Report`,
    '',
    '## Summary',
    '',
    `- Tournament ID: ${tournament.id}`,
    `- Status: ${tournament.status}`,
    `- Players: ${tournament.players.length}`,
    `- Current round: ${tournament.currentRound} of ${tournament.totalRounds}`,
    `- Created: ${formatDateTime(tournament.createdAt)}`,
    `- Updated: ${formatDateTime(tournament.updatedAt)}`,
    '',
    buildRegistrationSection(tournament.players),
    buildStandingsSection(tournament),
    buildRoundsSection(tournament),
    buildPlayerDetailSection(tournament),
  ].join('\n')
}

export function downloadTournamentExport(tournament: Tournament): void {
  const report = buildTournamentExport(tournament)
  const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const fileName = `${slugifyFileName(tournament.name)}-report.md`

  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}
