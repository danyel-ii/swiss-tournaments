import blossom from 'edmonds-blossom'
import {
  getPlayerColorHistory,
  getPlayersEnteredByRound,
  getPlayersEligibleForRound,
  getStandings,
  hasPlayerReceivedBye,
} from './ranking'
import type { Match, PairingAlgorithm, Player, PlayerColor, PlayerStanding, Tournament } from '../types/tournament'

interface CandidatePair {
  opponent: PlayerStanding
  repeatCount: number
  scoreGap: number
  rankGap: number
}

interface PairingPlan {
  pairs: Array<[PlayerStanding, PlayerStanding]>
  repeatCount: number
}

function hasZeroRepeatPlan(plan: PairingPlan | null): plan is PairingPlan {
  return plan !== null && plan.repeatCount === 0
}

function getZeroRepeatPlan(plan: PairingPlan | null): PairingPlan | null {
  return hasZeroRepeatPlan(plan) ? plan : null
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

function scorePairEdge(
  left: PlayerStanding,
  right: PlayerStanding,
  matches: Match[],
  round: number,
): number {
  const repeatPenalty = havePlayedBefore(left.playerId, right.playerId, matches) ? 300000 : 0
  const scoreGapPenalty = Math.abs(left.score - right.score) * 10000
  const rankGapPenalty = Math.abs(left.rank - right.rank) * 100
  const leftColorTuple = scoreColorOption(left, right, matches, round, round % 2 === 1)
  const rightColorTuple = scoreColorOption(right, left, matches, round, round % 2 === 1)
  const bestColorTuple = compareTuples(leftColorTuple, rightColorTuple) <= 0 ? leftColorTuple : rightColorTuple
  const colorPenalty =
    bestColorTuple[0] * 5000 +
    bestColorTuple[1] * 2500 +
    bestColorTuple[2] * 200 +
    bestColorTuple[3] * 50

  return Math.round(1_000_000 - repeatPenalty - scoreGapPenalty - rankGapPenalty - colorPenalty)
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

function compareStandings(left: PlayerStanding, right: PlayerStanding): number {
  if (left.rank !== right.rank) {
    return left.rank - right.rank
  }

  if (left.seed !== right.seed) {
    return left.seed - right.seed
  }

  return left.playerId.localeCompare(right.playerId)
}

function findMostConstrainedPlayer(
  players: PlayerStanding[],
  matches: Match[],
  allowRepeats: boolean,
): PlayerStanding {
  let bestPlayer = players[0]
  let bestCandidateCount = Number.POSITIVE_INFINITY

  for (const player of players) {
    const candidates = buildCandidatePairs(
      player,
      players.filter((entry) => entry.playerId !== player.playerId),
      matches,
      allowRepeats,
    )

    if (candidates.length < bestCandidateCount) {
      bestPlayer = player
      bestCandidateCount = candidates.length
    }
  }

  return bestPlayer
}

function scoreGreedyCandidate(
  candidate: CandidatePair,
  remaining: PlayerStanding[],
  matches: Match[],
  allowRepeats: boolean,
): number[] {
  const nextRemaining = remaining.filter(
    (entry) => entry.playerId !== candidate.opponent.playerId,
  )

  if (nextRemaining.length === 0) {
    return [0, candidate.scoreGap, candidate.repeatCount, candidate.rankGap, candidate.opponent.seed]
  }

  const nextPlayer = findMostConstrainedPlayer(nextRemaining, matches, allowRepeats)
  const nextCandidates = buildCandidatePairs(
    nextPlayer,
    nextRemaining.filter((entry) => entry.playerId !== nextPlayer.playerId),
    matches,
    allowRepeats,
  )

  return [
    nextCandidates.length === 0 ? 1 : 0,
    candidate.scoreGap,
    candidate.repeatCount,
    candidate.rankGap,
    candidate.opponent.seed,
  ]
}

function buildGreedyPairingPlan(
  players: PlayerStanding[],
  matches: Match[],
  allowRepeats: boolean,
): { pairs: Array<[PlayerStanding, PlayerStanding]>; repeatCount: number } | null {
  const remaining = [...players].sort(compareStandings)
  const pairs: Array<[PlayerStanding, PlayerStanding]> = []
  let repeatCount = 0

  while (remaining.length > 1) {
    const player = findMostConstrainedPlayer(remaining, matches, allowRepeats)
    const playerIndex = remaining.findIndex((entry) => entry.playerId === player.playerId)
    remaining.splice(playerIndex, 1)

    const candidates = buildCandidatePairs(player, remaining, matches, allowRepeats)

    if (candidates.length === 0) {
      return null
    }

    candidates.sort((left, right) => {
      const comparison = compareTuples(
        scoreGreedyCandidate(left, remaining, matches, allowRepeats),
        scoreGreedyCandidate(right, remaining, matches, allowRepeats),
      )

      if (comparison !== 0) {
        return comparison
      }

      return 0
    })

    const chosenCandidate = candidates[0]
    const opponentIndex = remaining.findIndex(
      (entry) => entry.playerId === chosenCandidate.opponent.playerId,
    )

    if (opponentIndex < 0) {
      return null
    }

    remaining.splice(opponentIndex, 1)
    pairs.push([player, chosenCandidate.opponent])
    repeatCount += chosenCandidate.repeatCount
  }

  return { pairs, repeatCount }
}

function createAttemptOrders(players: PlayerStanding[]): PlayerStanding[][] {
  const base = [...players].sort(compareStandings)
  const attempts: PlayerStanding[][] = [base]

  if (base.length > 2) {
    attempts.push([base[1], base[0], ...base.slice(2)])
  }

  if (base.length > 4) {
    attempts.push([...base.slice(2, 4), ...base.slice(0, 2), ...base.slice(4)])
  }

  if (base.length > 6) {
    attempts.push([...base.slice(0, 1), ...base.slice(3, 6), ...base.slice(1, 3), ...base.slice(6)])
  }

  return attempts
}

function buildBlossomPairingPlan(
  players: PlayerStanding[],
  matches: Match[],
  round: number,
  allowRepeats: boolean,
): PairingPlan | null {
  const sortedPlayers = [...players].sort(compareStandings)
  const edges: Array<[number, number, number]> = []

  for (let leftIndex = 0; leftIndex < sortedPlayers.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sortedPlayers.length; rightIndex += 1) {
      const left = sortedPlayers[leftIndex]
      const right = sortedPlayers[rightIndex]
      const repeated = havePlayedBefore(left.playerId, right.playerId, matches)

      if (!allowRepeats && repeated) {
        continue
      }

      edges.push([leftIndex, rightIndex, scorePairEdge(left, right, matches, round)])
    }
  }

  if (edges.length === 0) {
    return null
  }

  const matching = blossom(edges) as number[]

  if (!Array.isArray(matching) || matching.length < sortedPlayers.length) {
    return null
  }

  const pairs: Array<[PlayerStanding, PlayerStanding]> = []
  const visited = new Set<number>()
  let repeatCount = 0

  for (let index = 0; index < sortedPlayers.length; index += 1) {
    if (visited.has(index)) {
      continue
    }

    const partnerIndex = matching[index]

    if (
      typeof partnerIndex !== 'number' ||
      partnerIndex < 0 ||
      partnerIndex >= sortedPlayers.length ||
      matching[partnerIndex] !== index
    ) {
      return null
    }

    visited.add(index)
    visited.add(partnerIndex)

    const left = sortedPlayers[index]
    const right = sortedPlayers[partnerIndex]
    const orderedPair: [PlayerStanding, PlayerStanding] =
      compareStandings(left, right) <= 0 ? [left, right] : [right, left]

    pairs.push(orderedPair)
    repeatCount += Number(havePlayedBefore(left.playerId, right.playerId, matches))
  }

  if (visited.size !== sortedPlayers.length) {
    return null
  }

  pairs.sort((left, right) => comparePairSequence([left], [right]))

  return { pairs, repeatCount }
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
  round: number,
  pairingAlgorithm: PairingAlgorithm,
): Array<[PlayerStanding, PlayerStanding]> {
  const scoreGroups = groupPlayersByScore(players)
  const flattenedPlayers = [...scoreGroups.values()].flatMap((group) => group)
  let bestPlan: PairingPlan | null = null

  const considerPlan = (nextPlan: PairingPlan | null) => {
    if (!nextPlan) {
      return
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

  if (pairingAlgorithm === 'blossom') {
    considerPlan(buildBlossomPairingPlan(flattenedPlayers, matches, round, false))

    const blossomPerfectPlan = getZeroRepeatPlan(bestPlan)

    if (blossomPerfectPlan) {
      return blossomPerfectPlan.pairs
    }

    considerPlan(buildBlossomPairingPlan(flattenedPlayers, matches, round, true))
  }

  for (const allowRepeats of [false, true]) {
    for (const attempt of createAttemptOrders(flattenedPlayers)) {
      considerPlan(buildGreedyPairingPlan(attempt, matches, allowRepeats))
    }

    const greedyPerfectPlan = getZeroRepeatPlan(bestPlan)

    if (greedyPerfectPlan) {
      return greedyPerfectPlan.pairs
    }
  }

  if (!bestPlan) {
    throw new Error('Unable to generate Swiss pairings')
  }

  const finalPlan: PairingPlan = bestPlan

  return finalPlan.pairs
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
  pairingAlgorithm: PairingAlgorithm = 'greedy',
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
  const pairs = generateSwissPairs(activePlayers, matches, round, pairingAlgorithm)
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
    tournament.pairingAlgorithm,
  )
}
