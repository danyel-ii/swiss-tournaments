# Data Model and State Shape

## Design Principle

Persist the **minimum durable state** and compute standings as derived data.
Do **not** store duplicated score or Buchholz values on the player record.
This prevents drift and makes recomputation reliable.

## TypeScript Types

Use types equivalent to the following.

```ts
export type TournamentStatus = 'setup' | 'in_progress' | 'completed'

export type ManualMatchResult = '1-0' | '0-1' | '0.5-0.5' | '0-0'
export type MatchResult = ManualMatchResult | 'BYE'

export interface Player {
  id: string
  name: string
  seed: number
}

export interface Match {
  id: string
  round: number
  board: number
  whitePlayerId: string
  blackPlayerId: string | null
  result: MatchResult | null
  isBye: boolean
}

export interface Tournament {
  id: string
  name: string
  totalRounds: number
  currentRound: number
  status: TournamentStatus
  players: Player[]
  matches: Match[]
  version: 1
  createdAt: string
  updatedAt: string
}
```

## Derived Standing Model

Create a derived type for standings.

```ts
export interface PlayerStanding {
  playerId: string
  name: string
  seed: number
  score: number
  buchholz: number
  opponents: string[]
  colorHistory: Array<'W' | 'B'>
  receivedBye: boolean
  rank: number
}
```

## Important Data Semantics

### `seed`

- immutable registration order
- assigned when the player is added
- never reindexed after deletions during setup
- used for deterministic tie breaks

### `blackPlayerId`

- `null` only for a bye match

### `isBye`

- `true` only when the match is a bye pairing
- if `isBye === true`, then `blackPlayerId` must be `null`
- if `isBye === true`, then `result` must be `'BYE'`

### `result`

- `null` = pending / not yet entered
- any string result = completed

## State Management Approach

Use one of these simple approaches:

- `useReducer` in `App.tsx`, or
- `useReducer` + React context via a small `TournamentProvider`

Prefer a reducer because the tournament state transitions are explicit and easy to test.

## Recommended Reducer Actions

Use action names equivalent to these:

```ts
type TournamentAction =
  | { type: 'ADD_PLAYER'; payload: { name: string } }
  | { type: 'REMOVE_PLAYER'; payload: { playerId: string } }
  | { type: 'SET_TOTAL_ROUNDS'; payload: { totalRounds: number } }
  | { type: 'START_TOURNAMENT' }
  | { type: 'SET_MATCH_RESULT'; payload: { matchId: string; result: ManualMatchResult } }
  | { type: 'GENERATE_NEXT_ROUND' }
  | { type: 'RESET_TOURNAMENT' }
  | { type: 'LOAD_TOURNAMENT'; payload: { tournament: Tournament } }
```

## Derived Selectors

Implement selectors or helper functions for:

- `getCurrentRoundMatches(tournament)`
- `getCompletedMatches(tournament)`
- `getStandings(tournament)`
- `hasTournamentStarted(tournament)`
- `isCurrentRoundComplete(tournament)`
- `hasTournamentFinished(tournament)`
- `hasPlayerReceivedBye(playerId, matches)`
- `getPlayerOpponents(playerId, matches)`
- `getPlayerColorHistory(playerId, matches)`

## Persistence

Store the full `Tournament` object in `localStorage`.

### Storage key

```ts
const STORAGE_KEY = 'chessTournamentState'
```

### Persistence behavior

- load once on app startup
- save after each reducer transition that changes tournament state
- if storage is empty or invalid, create a clean default tournament state

### Validation behavior

Add lightweight validation when loading from storage:

- required top-level fields exist
- `version === 1`
- arrays are arrays
- invalid storage should be ignored and replaced with default state

## Default Tournament State

Use something close to:

```ts
const defaultTournament: Tournament = {
  id: crypto.randomUUID(),
  name: 'Chess Tournament',
  totalRounds: 5,
  currentRound: 0,
  status: 'setup',
  players: [],
  matches: [],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
```

## Derived Score Calculation Rules

For a given player, calculate score from completed matches only:

- `1-0`: White +1, Black +0
- `0-1`: White +0, Black +1
- `0.5-0.5`: both +0.5
- `0-0`: both +0
- `BYE`: bye player +1

## Derived Color History Rules

For color history:

- include only non-bye matches
- append `'W'` when the player is White
- append `'B'` when the player is Black
- include pending matches too, because pairing color balance depends on assigned colors from previous rounds, not only completed scores

## Match Editing Rules

- results may be edited for matches in the current round
- editing a result must immediately recompute standings
- previous rounds may remain read-only for simplicity

## Invariants

These should always hold:

- no two players share the same `id`
- seeds are unique
- a player may appear at most once per round
- a bye match has exactly one player
- a completed tournament has all rounds generated and all last-round matches completed
