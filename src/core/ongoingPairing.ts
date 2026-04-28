export const DEFAULT_ONGOING_TABLE_SETTINGS = {
  eloTau: 300,
  roundRobinGamma: 1.35,
  epsilon: 0.02,
  batchPairings: false,
}

export interface OngoingPairingPlayerInput {
  playerId: string
  name: string
  rating: number
  tableGames: number
  whiteGames: number
  blackGames: number
}

export interface OngoingPairingGameInput {
  whitePlayerId: string
  blackPlayerId: string
  result: string | null
  completedAt: string | null
  createdAt: string
}

export interface OngoingPairingSettings {
  eloTau: number
  roundRobinGamma: number
  epsilon: number
}

export interface WeightedPairingCandidate {
  whitePlayerId: string
  blackPlayerId: string
  whiteName: string
  blackName: string
  weight: number
  probability: number
  eloDifference: number
  gamesBetween: number
}

function pairKey(leftPlayerId: string, rightPlayerId: string): string {
  return [leftPlayerId, rightPlayerId].sort().join(':')
}

function comparePlayers(
  left: Pick<OngoingPairingPlayerInput, 'name' | 'playerId'>,
  right: Pick<OngoingPairingPlayerInput, 'name' | 'playerId'>,
): number {
  const nameComparison = left.name.localeCompare(right.name)

  if (nameComparison !== 0) {
    return nameComparison
  }

  return left.playerId.localeCompare(right.playerId)
}

function orientPair(
  left: OngoingPairingPlayerInput,
  right: OngoingPairingPlayerInput,
): { white: OngoingPairingPlayerInput; black: OngoingPairingPlayerInput } {
  const leftColorNeed = left.blackGames - left.whiteGames
  const rightColorNeed = right.blackGames - right.whiteGames

  if (leftColorNeed !== rightColorNeed) {
    return leftColorNeed > rightColorNeed
      ? { white: left, black: right }
      : { white: right, black: left }
  }

  return comparePlayers(left, right) <= 0
    ? { white: left, black: right }
    : { white: right, black: left }
}

function getRecentGamesBetween(
  games: OngoingPairingGameInput[],
  leftPlayerId: string,
  rightPlayerId: string,
): number {
  const targetKey = pairKey(leftPlayerId, rightPlayerId)

  return [...games]
    .sort((left, right) => {
      const leftDate = left.completedAt ?? left.createdAt
      const rightDate = right.completedAt ?? right.createdAt

      return new Date(rightDate).getTime() - new Date(leftDate).getTime()
    })
    .slice(0, 4)
    .filter((game) => pairKey(game.whitePlayerId, game.blackPlayerId) === targetKey)
    .length
}

export function buildOngoingPairingCandidates(params: {
  players: OngoingPairingPlayerInput[]
  games: OngoingPairingGameInput[]
  settings: OngoingPairingSettings
}): WeightedPairingCandidate[] {
  const settings = {
    ...DEFAULT_ONGOING_TABLE_SETTINGS,
    ...params.settings,
  }
  const players = [...params.players].sort(comparePlayers)
  const gamesBetween = new Map<string, number>()

  for (const game of params.games) {
    const key = pairKey(game.whitePlayerId, game.blackPlayerId)
    gamesBetween.set(key, (gamesBetween.get(key) ?? 0) + 1)
  }

  const weightedCandidates: Array<Omit<WeightedPairingCandidate, 'probability'>> = []

  for (let leftIndex = 0; leftIndex < players.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < players.length; rightIndex += 1) {
      const left = players[leftIndex]
      const right = players[rightIndex]
      const key = pairKey(left.playerId, right.playerId)
      const pairGames = gamesBetween.get(key) ?? 0
      const recentGames = getRecentGamesBetween(params.games, left.playerId, right.playerId)
      const eloDifference = Math.abs(left.rating - right.rating)
      const eloSimilarity = Math.exp(-eloDifference / Math.max(settings.eloTau, 1))
      const roundRobinPressure = Math.pow(1 + pairGames, -settings.roundRobinGamma)
      const recencyPressure = 1 / (1 + recentGames * 2)
      const activityBalance =
        1 + Math.min(Math.abs(left.tableGames - right.tableGames), 10) * 0.03
      const orientation = orientPair(left, right)
      const weight =
        Math.max(settings.epsilon, 0.000001) +
        eloSimilarity * roundRobinPressure * recencyPressure * activityBalance

      weightedCandidates.push({
        whitePlayerId: orientation.white.playerId,
        blackPlayerId: orientation.black.playerId,
        whiteName: orientation.white.name,
        blackName: orientation.black.name,
        weight,
        eloDifference,
        gamesBetween: pairGames,
      })
    }
  }

  const totalWeight = weightedCandidates.reduce((total, candidate) => total + candidate.weight, 0)

  return weightedCandidates.map((candidate) => ({
    ...candidate,
    probability: totalWeight > 0 ? candidate.weight / totalWeight : 0,
  }))
}

export function selectWeightedPairing(
  candidates: WeightedPairingCandidate[],
  random: () => number = Math.random,
): WeightedPairingCandidate | null {
  if (candidates.length === 0) {
    return null
  }

  const totalWeight = candidates.reduce((total, candidate) => total + candidate.weight, 0)

  if (totalWeight <= 0) {
    return candidates[0]
  }

  const target = random() * totalWeight
  let cursor = 0

  for (const candidate of candidates) {
    cursor += candidate.weight

    if (target <= cursor) {
      return candidate
    }
  }

  return candidates[candidates.length - 1]
}

export function selectWeightedPairingBatch(params: {
  players: OngoingPairingPlayerInput[]
  games: OngoingPairingGameInput[]
  settings: OngoingPairingSettings
  random?: () => number
}): WeightedPairingCandidate[] {
  const selected: WeightedPairingCandidate[] = []
  let remainingPlayers = params.players
  const games = [...params.games]

  while (remainingPlayers.length >= 2) {
    const candidates = buildOngoingPairingCandidates({
      players: remainingPlayers,
      games,
      settings: params.settings,
    })
    const next = selectWeightedPairing(candidates, params.random)

    if (!next) {
      break
    }

    selected.push(next)
    games.push({
      whitePlayerId: next.whitePlayerId,
      blackPlayerId: next.blackPlayerId,
      result: null,
      completedAt: null,
      createdAt: new Date(0).toISOString(),
    })

    const pairedIds = new Set([next.whitePlayerId, next.blackPlayerId])
    remainingPlayers = remainingPlayers.filter((player) => !pairedIds.has(player.playerId))
  }

  return selected
}
