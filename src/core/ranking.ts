import type {
  Match,
  MatchResult,
  Player,
  PlayerColor,
  PlayerStanding,
  Tournament,
} from '../types/tournament'

function sortMatchesChronologically(matches: Match[]): Match[] {
  return [...matches].sort((left, right) => {
    if (left.round !== right.round) {
      return left.round - right.round
    }

    return left.board - right.board
  })
}

export function hasTournamentStarted(tournament: Tournament): boolean {
  return tournament.status !== 'setup'
}

export function hasTournamentFinished(tournament: Tournament): boolean {
  return tournament.status === 'completed'
}

export function getCurrentRoundMatches(tournament: Tournament): Match[] {
  if (tournament.currentRound < 1) {
    return []
  }

  return getRoundMatches(tournament.matches, tournament.currentRound)
}

export function getRoundMatches(matches: Match[], round: number): Match[] {
  return sortMatchesChronologically(
    matches.filter((match) => match.round === round),
  )
}

export function getCompletedMatches(tournament: Tournament): Match[] {
  return tournament.matches.filter((match) => match.result !== null)
}

export function isMatchComplete(match: Match): boolean {
  return match.result !== null
}

export function isCurrentRoundComplete(
  matches: Match[],
  round: number,
): boolean {
  const roundMatches = matches.filter((match) => match.round === round)

  if (roundMatches.length === 0) {
    return false
  }

  return roundMatches.every((match) => match.isBye || match.result !== null)
}

export function hasPlayerReceivedBye(
  playerId: string,
  matches: Match[],
): boolean {
  return matches.some(
    (match) =>
      match.isBye &&
      match.whitePlayerId === playerId &&
      match.result === 'BYE',
  )
}

export function getPlayerOpponents(playerId: string, matches: Match[]): string[] {
  return sortMatchesChronologically(matches)
    .filter(
      (match) =>
        !match.isBye &&
        match.result !== null &&
        (match.whitePlayerId === playerId || match.blackPlayerId === playerId),
    )
    .map((match) =>
      match.whitePlayerId === playerId
        ? (match.blackPlayerId as string)
        : match.whitePlayerId,
    )
}

export function getPlayerColorHistory(
  playerId: string,
  matches: Match[],
): PlayerColor[] {
  return sortMatchesChronologically(matches)
    .filter(
      (match) =>
        !match.isBye &&
        (match.whitePlayerId === playerId || match.blackPlayerId === playerId),
    )
    .map((match) => (match.whitePlayerId === playerId ? 'W' : 'B'))
}

export function getMatchPointsForPlayer(
  match: Match,
  playerId: string,
): number {
  if (match.result === null) {
    return 0
  }

  if (match.result === 'BYE') {
    return match.whitePlayerId === playerId ? 1 : 0
  }

  if (match.result === '1-0') {
    return match.whitePlayerId === playerId ? 1 : 0
  }

  if (match.result === '0-1') {
    return match.blackPlayerId === playerId ? 1 : 0
  }

  if (match.result === '0.5-0.5') {
    return match.whitePlayerId === playerId || match.blackPlayerId === playerId
      ? 0.5
      : 0
  }

  return 0
}

export function getPlayerScore(playerId: string, matches: Match[]): number {
  return matches.reduce((score, match) => {
    return score + getMatchPointsForPlayer(match, playerId)
  }, 0)
}

export function getPlayerBuchholz(
  playerId: string,
  players: Player[],
  matches: Match[],
): number {
  const completedMatches = matches.filter((match) => match.result !== null)
  const opponentIds = getPlayerOpponents(playerId, completedMatches)

  return opponentIds.reduce((total, opponentId) => {
    if (!players.some((player) => player.id === opponentId)) {
      return total
    }

    return total + getPlayerScore(opponentId, completedMatches)
  }, 0)
}

function compareStandingSort(
  left: Omit<PlayerStanding, 'rank'>,
  right: Omit<PlayerStanding, 'rank'>,
): number {
  if (left.score !== right.score) {
    return right.score - left.score
  }

  if (left.buchholz !== right.buchholz) {
    return right.buchholz - left.buchholz
  }

  if (left.seed !== right.seed) {
    return left.seed - right.seed
  }

  return left.name.localeCompare(right.name)
}

export function getPlayerStats(
  playerId: string,
  players: Player[],
  matches: Match[],
): PlayerStanding {
  const player = players.find((entry) => entry.id === playerId)

  if (!player) {
    throw new Error(`Unknown player: ${playerId}`)
  }

  const completedMatches = matches.filter((match) => match.result !== null)
  const baseStanding = {
    playerId: player.id,
    name: player.name,
    seed: player.seed,
    score: getPlayerScore(player.id, completedMatches),
    buchholz: getPlayerBuchholz(player.id, players, completedMatches),
    opponents: getPlayerOpponents(player.id, completedMatches),
    colorHistory: getPlayerColorHistory(player.id, matches),
    receivedBye: hasPlayerReceivedBye(player.id, matches),
  }

  const sorted = players
    .map((entry) => {
      if (entry.id === player.id) {
        return baseStanding
      }

      return {
        playerId: entry.id,
        name: entry.name,
        seed: entry.seed,
        score: getPlayerScore(entry.id, completedMatches),
        buchholz: getPlayerBuchholz(entry.id, players, completedMatches),
        opponents: getPlayerOpponents(entry.id, completedMatches),
        colorHistory: getPlayerColorHistory(entry.id, matches),
        receivedBye: hasPlayerReceivedBye(entry.id, matches),
      }
    })
    .sort(compareStandingSort)

  const rank = sorted.findIndex((entry) => entry.playerId === player.id) + 1

  return {
    ...baseStanding,
    rank,
  }
}

export function getStandings(
  players: Player[],
  matches: Match[],
): PlayerStanding[] {
  const completedMatches = matches.filter((match) => match.result !== null)

  return players
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      seed: player.seed,
      score: getPlayerScore(player.id, completedMatches),
      buchholz: getPlayerBuchholz(player.id, players, completedMatches),
      opponents: getPlayerOpponents(player.id, completedMatches),
      colorHistory: getPlayerColorHistory(player.id, matches),
      receivedBye: hasPlayerReceivedBye(player.id, matches),
    }))
    .sort(compareStandingSort)
    .map((standing, index) => ({
      ...standing,
      rank: index + 1,
    }))
}

export function getResultLabel(result: MatchResult | null): string {
  return result ?? 'Pending'
}
