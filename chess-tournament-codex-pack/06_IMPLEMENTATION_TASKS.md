# Implementation Tasks

Implement the app in the following order.

## Phase 1: Scaffold

1. Create a Vite React TypeScript app.
2. Configure TailwindCSS.
3. Add the folder structure described in the architecture doc.
4. Create the shared TypeScript types.

## Phase 2: Core tournament helpers

Implement the pure helpers first.

### 2.1 Ranking and scoring

Build helpers for:

- score calculation from match results
- opponent extraction
- color history extraction
- bye detection
- Buchholz calculation
- standings sorting

Make sure these helpers work before any UI wiring.

### 2.2 Round completion checks

Add helpers to determine:

- current round matches
- whether a round is complete
- whether the tournament has finished

## Phase 3: Pairing engine

### 3.1 Round 1 pairings

Implement the seed-based round 1 rule exactly.

### 3.2 Later Swiss pairings

Implement the simplified Swiss pairing engine:

- compute standings
- create score groups
- assign bye if needed
- attempt pairings with deterministic backtracking
- first try avoiding repeats entirely
- if impossible, allow the minimum necessary repeats
- assign colors using the defined rules
- assign board numbers sequentially

Keep the code readable and split into helper functions.

Suggested helper breakdown:

- `getSortedPlayersForPairing()`
- `selectByePlayer()`
- `groupPlayersByScore()`
- `havePlayedBefore()`
- `assignColors()`
- `pairGroupWithBacktracking()`
- `generateSwissPairings()`

## Phase 4: Tournament state transitions

Implement reducer-safe state transitions for:

- add player
- remove player
- set total rounds
- start tournament
- set match result
- generate next round
- reset tournament

Rules:

- starting the tournament generates round 1 immediately
- generating next round increments `currentRound`
- after the last round is complete, set status to `completed`

## Phase 5: Persistence

1. Implement `loadTournament()`.
2. Implement `saveTournament()`.
3. Restore saved state on app startup.
4. Save after every state change.

## Phase 6: UI

Build the UI after the core logic works.

### 6.1 Setup UI

- player input
- player list
- rounds input
- start/reset controls

### 6.2 In-progress UI

- current round pairings table
- result dropdowns
- current standings table
- generate next round button

### 6.3 Completed UI

- final standings banner
- locked tournament state
- reset action

## Phase 7: Guardrails and polish

Add:

- disabled states for invalid actions
- confirmation before full reset
- duplicate-name warning
- empty-state messages
- clear round-status indicator

## Phase 8: Tests

Write tests for the core logic.

At minimum cover:

- `1-0`, `0-1`, `0.5-0.5`, `0-0`, `BYE`
- Buchholz computation
- round 1 pairing structure
- single bye assignment
- no next round generation when results are missing
- repeat pairing avoidance in a small tournament scenario

## Final Quality Pass

Before finishing, verify manually:

1. create a tournament with 8 players
2. run 3 rounds
3. refresh the page in the middle
4. continue successfully
5. finish tournament
6. verify final standings are stable and sorted correctly
