import {
  getPlayerColorHistory,
  getPlayersEnteredByRound,
  getPlayersEligibleForRound,
  getStandings,
  hasPlayerReceivedBye,
} from './ranking'
import type { Match, Player, PlayerColor, PlayerStanding, Tournament } from '../types/tournament'

interface PairingPlan {
  pairs: Array<[PlayerStanding, PlayerStanding]>
  repeatCount: number
}

interface CandidatePair {
  opponent: PlayerStanding
  repeatCount: number
  scoreGap: number
  rankGap: number
}

function createMatch(params: {
  round: number
  board: number
  whitePlayerId: string
  blackPlayerId: string | null
  result: Match['result']
  isBye: boolean
}): Match {
  return {
    id: crypto.randomUUID(),
    round: params.round,
    board: params.board,
    whitePlayerId: params.whitePlayerId,
    blackPlayerId: params.blackPlayerId,
    result: params.result,
    isBye: params.isBye,
  }
}

function groupPlayersByScore(players: PlayerStanding[]): Map<number, PlayerStanding[]> {
  return players.reduce((groups, player) => {
    const existing = groups.get(player.score) ?? []
    existing.push(player)
    groups.set(player.score, existing)
    return groups
  }, new Map<number, PlayerStanding[]>())
}

function havePlayedBefore(leftId: string, rightId: string, matches: Match[]): boolean {
  return matches.some((match) => {
    if (match.isBye) {
      return false
    }

    return (
      (match.whitePlayerId === leftId && match.blackPlayerId === rightId) ||
      (match.whitePlayerId === rightId && match.blackPlayerId === leftId)
    )
  })
}

function getColorImbalance(playerId: string, matches: Match[]): number {
  return getPlayerColorHistory(playerId, matches).reduce((imbalance, color) => {
    return imbalance + (color === 'W' ? 1 : -1)
  }, 0)
}

function wouldCreateThirdColor(playerId: string, color: PlayerColor, matches: Match[]): boolean {
  const history = getPlayerColorHistory(playerId, matches)
  const recent = history.slice(-2)

  return recent.length === 2 && recent[0] === color && recent[1] === color
}

function compareTuples(left: number[], right: number[]): number {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index]
    }
  }

  return 0
}

function assignColors(
  first: PlayerStanding,
  second: PlayerStanding,
  matches: Match[],
  round: number,
): { white: PlayerStanding; black: PlayerStanding } {
  const fallbackHigherRankedWhite = round % 2 === 1

  const options = [
    { white: first, black: second },
    { white: second, black: first },
  ]

  options.sort((left, right) => {
    const leftTuple = scoreColorOption(left.white, left.black, matches, round, fallbackHigherRankedWhite)
    const rightTuple = scoreColorOption(
      right.white,
      right.black,
      matches,
      round,
      fallbackHigherRankedWhite,
    )
    return compareTuples(leftTuple, rightTuple)
  })

  return options[0]
}

function scoreColorOption(
  white: PlayerStanding,
  black: PlayerStanding,
  matches: Match[],
  round: number,
  fallbackHigherRankedWhite: boolean,
): number[] {
  const whiteImbalance = getColorImbalance(white.playerId, matches)
  const blackImbalance = getColorImbalance(black.playerId, matches)

  const whitePrefersWhite = whiteImbalance < 0
  const blackPrefersBlack = blackImbalance > 0

  const mutualPreferenceScore =
    whitePrefersWhite && blackPrefersBlack ? 0 : 1

  const streakPenalty =
    Number(wouldCreateThirdColor(white.playerId, 'W', matches)) +
    Number(wouldCreateThirdColor(black.playerId, 'B', matches))

  const balancePenalty =
    Math.abs(whiteImbalance + 1) + Math.abs(blackImbalance - 1)

  const higherRankedGetsWhite = white.rank < black.rank
  const fallbackPenalty =
    fallbackHigherRankedWhite === higherRankedGetsWhite ? 0 : 1

  return [
    mutualPreferenceScore,
    streakPenalty,
    balancePenalty,
    fallbackPenalty,
    Math.abs(white.rank - black.rank),
    round,
  ]
}

function buildCandidatePairs(
  player: PlayerStanding,
  candidates: PlayerStanding[],
  matches: Match[],
  allowRepeats: boolean,
): CandidatePair[] {
  return candidates
    .map((candidate) => ({
      opponent: candidate,
      repeatCount: havePlayedBefore(player.playerId, candidate.playerId, matches) ? 1 : 0,
      scoreGap: Math.abs(player.score - candidate.score),
      rankGap: Math.abs(player.rank - candidate.rank),
    }))
    .filter((candidate) => allowRepeats || candidate.repeatCount === 0)
    .sort((left, right) => {
      if (left.scoreGap !== right.scoreGap) {
        return left.scoreGap - right.scoreGap
      }

      if (left.repeatCount !== right.repeatCount) {
        return left.repeatCount - right.repeatCount
      }

      if (left.rankGap !== right.rankGap) {
        return left.rankGap - right.rankGap
      }

      return left.opponent.seed - right.opponent.seed
    })
}

function pairGroupWithBacktracking(
  players: PlayerStanding[],
  matches: Match[],
  allowRepeats: boolean,
): PairingPlan | null {
  if (players.length === 0) {
    return { pairs: [], repeatCount: 0 }
  }

  const [player, ...rest] = players
  const candidates = buildCandidatePairs(player, rest, matches, allowRepeats)
  let bestPlan: PairingPlan | null = null

  for (const candidate of candidates) {
    const remaining = rest.filter(
      (entry) => entry.playerId !== candidate.opponent.playerId,
    )
    const remainderPlan = pairGroupWithBacktracking(
      remaining,
      matches,
      allowRepeats,
    )

    if (!remainderPlan) {
      continue
    }

    const nextPlan: PairingPlan = {
      pairs: [[player, candidate.opponent], ...remainderPlan.pairs],
      repeatCount: candidate.repeatCount + remainderPlan.repeatCount,
    }

    if (
      !bestPlan ||
      nextPlan.repeatCount < bestPlan.repeatCount ||
      (nextPlan.repeatCount === bestPlan.repeatCount &&
        comparePairSequence(nextPlan.pairs, bestPlan.pairs) < 0)
    ) {
      bestPlan = nextPlan
    }
  }

  return bestPlan
}

function comparePairSequence(
  left: Array<[PlayerStanding, PlayerStanding]>,
  right: Array<[PlayerStanding, PlayerStanding]>,
): number {
  const length = Math.min(left.length, right.length)

  for (let index = 0; index < length; index += 1) {
    const [leftA, leftB] = left[index]
    const [rightA, rightB] = right[index]
    const leftTuple = [leftA.rank, leftB.rank, leftA.seed, leftB.seed]
    const rightTuple = [rightA.rank, rightB.rank, rightA.seed, rightB.seed]
    const comparison = compareTuples(leftTuple, rightTuple)

    if (comparison !== 0) {
      return comparison
    }
  }

  return left.length - right.length
}

function generateSwissPairs(
  players: PlayerStanding[],
  matches: Match[],
): Array<[PlayerStanding, PlayerStanding]> {
  const scoreGroups = groupPlayersByScore(players)
  const flattenedPlayers = [...scoreGroups.values()].flatMap((group) => group)
  const noRepeatPlan = pairGroupWithBacktracking(flattenedPlayers, matches, false)

  if (noRepeatPlan) {
    return noRepeatPlan.pairs
  }

  const repeatPlan = pairGroupWithBacktracking(flattenedPlayers, matches, true)

  if (!repeatPlan) {
    throw new Error('Unable to generate Swiss pairings')
  }

  return repeatPlan.pairs
}

function selectByePlayer(
  players: PlayerStanding[],
  matches: Match[],
  round: number,
): PlayerStanding {
  if (round === 1) {
    return [...players].sort((left, right) => right.seed - left.seed)[0]
  }

  const lowestRankedFirst = [...players].sort((left, right) => right.rank - left.rank)
  const eligible = lowestRankedFirst.find(
    (player) => !hasPlayerReceivedBye(player.playerId, matches),
  )

  return eligible ?? lowestRankedFirst[0]
}

export function generateRoundOnePairings(players: Player[]): Match[] {
  const seeded = [...players].sort((left, right) => left.seed - right.seed)
  const pairablePlayers = [...seeded]
  const matches: Match[] = []
  let byePlayer: Player | null = null

  if (pairablePlayers.length % 2 === 1) {
    byePlayer = pairablePlayers.pop() ?? null
  }

  const half = pairablePlayers.length / 2
  const topHalf = pairablePlayers.slice(0, half)
  const bottomHalf = pairablePlayers.slice(half)

  topHalf.forEach((player, index) => {
    const opponent = bottomHalf[index]
    const board = index + 1
    const betterSeedGetsWhite = board % 2 === 1
    const whitePlayer = betterSeedGetsWhite ? player : opponent
    const blackPlayer = betterSeedGetsWhite ? opponent : player

    matches.push(
      createMatch({
        round: 1,
        board,
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        result: null,
        isBye: false,
      }),
    )
  })

  if (byePlayer) {
    matches.push(
      createMatch({
        round: 1,
        board: matches.length + 1,
        whitePlayerId: byePlayer.id,
        blackPlayerId: null,
        result: 'BYE',
        isBye: true,
      }),
    )
  }

  return matches
}

export function generateSwissRoundPairings(
  players: Player[],
  matches: Match[],
  round: number,
): Match[] {
  const standings = getStandings(players, matches)
  const eligiblePlayerIds = new Set(getPlayersEligibleForRound(players, round).map((player) => player.id))
  const pairingPool = standings.filter((player) => eligiblePlayerIds.has(player.playerId))
  let byePlayer: PlayerStanding | null = null

  if (pairingPool.length % 2 === 1) {
    byePlayer = selectByePlayer(pairingPool, matches, round)
  }

  const activePlayers = pairingPool.filter(
    (player) => player.playerId !== byePlayer?.playerId,
  )
  const pairs = generateSwissPairs(activePlayers, matches)
  const roundMatches = pairs.map(([left, right], index) => {
    const colors = assignColors(left, right, matches, round)

    return createMatch({
      round,
      board: index + 1,
      whitePlayerId: colors.white.playerId,
      blackPlayerId: colors.black.playerId,
      result: null,
      isBye: false,
    })
  })

  if (byePlayer) {
    roundMatches.push(
      createMatch({
        round,
        board: roundMatches.length + 1,
        whitePlayerId: byePlayer.playerId,
        blackPlayerId: null,
        result: 'BYE',
        isBye: true,
      }),
    )
  }

  return roundMatches
}

export function generatePairings(tournament: Tournament): Match[] {
  if (tournament.currentRound === 0) {
    return generateRoundOnePairings(getPlayersEligibleForRound(tournament.players, 1))
  }

  return generateSwissRoundPairings(
    getPlayersEnteredByRound(tournament.players, tournament.currentRound + 1),
    tournament.matches,
    tournament.currentRound + 1,
  )
}
