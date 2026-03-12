# Technical Architecture

## Required Stack

Use:

- React
- TypeScript
- Vite
- TailwindCSS
- Vitest for core logic tests

No backend.
No database.
No authentication.

## Project Structure

Use a structure close to this:

```text
src/
  components/
    ActionBar.tsx
    PairingsView.tsx
    PlayerList.tsx
    StandingsTable.tsx
    TournamentControls.tsx
    TournamentHeader.tsx
  core/
    ranking.ts
    swissPairing.ts
    tournament.ts
  hooks/
    useTournament.ts
  types/
    tournament.ts
  utils/
    storage.ts
    format.ts
  App.tsx
  main.tsx
```

The exact filenames can vary slightly, but keep the separation of concerns.

## Separation of Concerns

### `src/core`

Pure logic only.
No React imports.
No DOM code.
No localStorage access.

This folder should contain:

- standings calculation
- Buchholz calculation
- pairing generation
- round progression helpers
- score application helpers

### `src/components`

Presentation and interaction only.
Components may call hooks or actions, but must not directly implement Swiss logic.

### `src/utils/storage.ts`

This file owns `localStorage` reads/writes.

## Recommended Core Modules

### `ranking.ts`

Responsibilities:

- compute player scores
- compute opponent lists
- compute color histories
- compute Buchholz
- produce sorted standings

Suggested exports:

```ts
getStandings(players, matches): PlayerStanding[]
getPlayerStats(playerId, players, matches): PlayerStanding
isCurrentRoundComplete(matches, round): boolean
```

### `swissPairing.ts`

Responsibilities:

- generate round 1 pairings
- generate later Swiss pairings
- avoid repeat pairings where possible
- assign bye
- assign colors deterministically

Suggested exports:

```ts
generatePairings(tournament: Tournament): Match[]
generateRoundOnePairings(players: Player[]): Match[]
generateSwissRoundPairings(players: Player[], matches: Match[], round: number): Match[]
```

### `tournament.ts`

Responsibilities:

- create default tournament state
- start tournament
- apply result edits
- advance round
- reset tournament

Suggested exports:

```ts
createDefaultTournament(): Tournament
startTournament(tournament: Tournament): Tournament
setMatchResult(tournament: Tournament, matchId: string, result: ManualMatchResult): Tournament
generateNextRound(tournament: Tournament): Tournament
resetTournament(): Tournament
```

## State Flow

Use a reducer or reducer-like pattern:

1. UI dispatches intent
2. reducer calls pure `core` helper
3. new `Tournament` state is returned
4. new state is persisted to `localStorage`
5. UI rerenders from derived state

## Persistence Strategy

### Required behavior

- persist after every meaningful mutation
- restore on startup
- ignore invalid saved data gracefully

### Suggested implementation

```ts
loadTournament(): Tournament | null
saveTournament(tournament: Tournament): void
clearTournament(): void
```

## Determinism Requirements

The following must be deterministic:

- standings ordering
- round 1 pairings
- later round pairings
- color assignment tie breaks
- bye selection

Do not use randomness anywhere.

## Testing Strategy

Add unit tests for `src/core`.

### Minimum tests

- scoring from all result types
- Buchholz calculation
- round 1 pairing generation
- repeat avoidance where possible
- bye assignment rules
- next-round generation blocked when a round is incomplete

## Implementation Preferences

- use `crypto.randomUUID()` for ids
- keep utility functions small and composable
- prefer pure functions over classes
- avoid premature abstractions
- write clear function names instead of clever code

## Styling

Use Tailwind utilities directly.
No design system library is required.
No component library is required.

## Nice-to-Have but Optional

If implementation remains clean, optionally add:

- export/import tournament JSON
- a small tournament summary card
- read-only display of previous rounds

These are optional and must not delay the core flow.
