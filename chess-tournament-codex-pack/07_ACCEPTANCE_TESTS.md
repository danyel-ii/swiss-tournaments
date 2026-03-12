# Acceptance Tests

Use this file as the final verification checklist.

## A. Setup and Validation

### A1. Empty setup

- Open the app with no saved state.
- Expect an empty tournament in `setup` status.
- Expect the pairings panel to show an empty state.
- Expect `Start Tournament` to be disabled.

### A2. Add players

- Add `Alice`.
- Add `Bob`.
- Expect both players to appear in the player list.
- Expect seeds to be assigned in add order.
- Expect `Start Tournament` to become enabled once there are at least 2 players and rounds are valid.

### A3. Duplicate names

- Add `Alice` again.
- Expect the app to allow it.
- Expect a duplicate-name warning to appear.
- Expect both `Alice` entries to remain distinguishable internally by unique ids/seeds.

### A4. Remove players during setup

- Remove a player before starting.
- Expect removal to succeed.
- Start the tournament.
- Expect player removal controls to become disabled or unavailable afterward.

## B. Round 1 Pairing

### B1. Even number of players

Create 8 players in this order:

1. Alice
2. Bob
3. Carol
4. David
5. Eva
6. Frank
7. Grace
8. Henry

Start the tournament.

Expect round 1 pairings to follow the seed split rule:

- Board 1: seed 1 vs seed 5
- Board 2: seed 2 vs seed 6
- Board 3: seed 3 vs seed 7
- Board 4: seed 4 vs seed 8

Expect colors to follow the board-parity rule from the domain doc.

### B2. Odd number of players

Create 5 players in this order:

1. Alice
2. Bob
3. Carol
4. David
5. Eva

Start the tournament.

Expect:

- seed 5 receives the round 1 bye
- remaining players pair as 1 vs 3 and 2 vs 4
- the bye match is marked `BYE`
- the bye row is not editable

## C. Result Entry and Scoring

### C1. Win/loss

In any normal match, enter `1-0`.

Expect:

- White gains 1 point
- Black gains 0 points
- standings update immediately

### C2. Draw

Enter `0.5-0.5`.

Expect both players to gain 0.5 points.

### C3. Double zero result

Enter `0-0`.

Expect:

- both players gain 0 points
- the round still counts that board as completed
- the app must not confuse `0-0` with a missing result

### C4. Bye score

When a player has a bye:

- expect the result to be stored as `BYE`
- expect the player to gain 1 point automatically

## D. Standings and Tiebreaks

### D1. Sorting

After entering a mix of results, verify standings are sorted by:

1. score descending
2. Buchholz descending
3. seed ascending
4. name ascending

### D2. Buchholz

Create a small tournament where two players have the same score but different-strength opponents.

Expect the player whose opponents have the higher combined score to rank above the other.

### D3. Bye and Buchholz

Verify that a bye does not add an opponent and contributes 0 Buchholz.

## E. Round Progression

### E1. Incomplete round

Leave one non-bye match without a result.

Expect:

- `Generate Next Round` remains disabled
- the UI indicates the round is incomplete

### E2. Complete round

Enter results for all non-bye boards.

Expect:

- `Generate Next Round` becomes enabled
- clicking it creates the next round pairings
- `currentRound` increments by 1

### E3. Final round completion

Finish the last configured round.

Expect:

- tournament status becomes `completed`
- final standings remain visible
- no new round is generated

## F. Repeat Avoidance

### F1. No avoidable repeats

Run a tournament with 8 players for at least 3 rounds.

Expect:

- the pairing engine avoids repeated pairings whenever a non-repeat solution exists

### F2. If repeats become unavoidable

In a small constrained tournament scenario, if a repeat is necessary to complete a round:

- expect the app to still generate the round
- expect it to use the minimum necessary repeats

## G. Bye Distribution

### G1. Single bye preference

Run an odd-player tournament for multiple rounds.

Expect:

- the app to avoid giving the same player a second bye while another lower-ranked eligible player exists who has not yet had one

## H. Persistence

### H1. Refresh safety

- start a tournament
- enter some results
- refresh the page

Expect:

- the tournament to reload from `localStorage`
- player list, round, results, and standings to remain intact

### H2. Reset

- click reset and confirm

Expect:

- all stored tournament data cleared
- app returns to a clean setup state

## I. Minimum Unit Tests to Include

Implement automated tests covering at least:

- score calculation for every result type
- Buchholz calculation
- round 1 pairings for even player count
- round 1 pairings for odd player count with bye
- next-round generation blocked on incomplete round
- player gets at most one bye when alternatives exist
- repeat pairing avoided in a solvable scenario
