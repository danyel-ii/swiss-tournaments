# Product Requirements

## Goal

Create a small tournament-management app for running a **Swiss-system chess tournament** from a single browser.

The intended user is a **tournament organizer** who needs a practical tool, not a full federation-grade arbiter system.

## Primary Use Case

A user opens the app, adds players, chooses the number of rounds, starts the tournament, enters results after each round, and lets the app compute standings and the next round pairings.

## In Scope

### 1. Tournament setup

The organizer can:

- add a player by name
- remove a player before the tournament starts
- choose the number of rounds before the tournament starts
- reset the tournament entirely

### 2. Round management

The app can:

- generate round 1 pairings
- show current round pairings in board order
- let the organizer manually record results for each board
- immediately update standings after result changes
- enable next-round generation only when the current round is complete

### 3. Standings

The app can:

- calculate total score for each player
- calculate Buchholz tiebreak
- sort standings deterministically
- show the current ranking after each round
- show final standings after the last round

### 4. Persistence

The app can:

- save tournament state to `localStorage`
- restore the tournament automatically on page refresh

## Out of Scope

Do **not** build the following unless they are trivial and clearly isolated:

- user accounts
- online multiplayer play
- board clocks
- PGN export
- FIDE-perfect pairing rules
- rating calculations
- team tournaments
- multiple simultaneous tournaments
- remote database sync

## User Stories

### Setup

- As an organizer, I want to add players quickly so I can prepare the tournament list.
- As an organizer, I want to remove mistaken entries before the event starts.
- As an organizer, I want to choose the total number of rounds.

### During play

- As an organizer, I want the app to generate pairings for the current round.
- As an organizer, I want to record each result manually.
- As an organizer, I want standings to update immediately so I can verify rankings.
- As an organizer, I want the next round pairings generated from current standings.

### Completion

- As an organizer, I want the tournament to clearly indicate when it is finished.
- As an organizer, I want final standings to remain visible after the last round.

## Functional Requirements

### Player management

- Player names are required.
- Leading and trailing whitespace must be trimmed.
- Empty names are rejected.
- Duplicate names are allowed, but the UI must display a warning when a duplicate is added.
- Players cannot be removed after the tournament starts.

### Tournament setup

- The number of rounds must be configurable before the tournament starts.
- Accept an integer value from 1 to 20.
- The tournament cannot start with fewer than 2 players.

### Pairings

- The app must generate round 1 pairings.
- The app must generate subsequent pairings using a simplified deterministic Swiss algorithm.
- The app should avoid repeated pairings whenever possible.
- If the player count is odd, exactly one player receives a bye in that round.
- A player should not receive more than one bye unless unavoidable.

### Results

Allowed manually entered results are exactly:

- `1-0`
- `0-1`
- `0.5-0.5`
- `0-0`

Internal system behavior may also use `BYE` for auto-created bye matches.

### Round progression

- The app may not generate the next round until all non-bye pairings in the current round have a completed result.
- After the final round is completed, the tournament status becomes `completed`.

## Non-Functional Requirements

- The app should feel fast for tournaments up to about 100 players.
- The UI should be clear enough to use live during an event.
- Core tournament logic must be isolated from UI code.
- State persistence should survive page refreshes.
- The app should behave deterministically for the same input state.

## Success Criteria

A complete tournament can be run in the following flow without breaking:

1. Add players
2. Set round count
3. Start tournament
4. Record all round results
5. Generate next round
6. Repeat until finished
7. View final standings
