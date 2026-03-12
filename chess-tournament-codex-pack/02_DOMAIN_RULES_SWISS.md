# Domain Rules: Simplified Swiss Tournament Logic

## Purpose

This app uses a **simplified Swiss-system pairing model**.
It is intentionally not a full FIDE arbiter engine.
It must, however, be internally consistent, deterministic, and suitable for practical small-to-medium tournaments.

## Result Semantics

### Valid completed match results

- `1-0` = White scores 1, Black scores 0
- `0-1` = White scores 0, Black scores 1
- `0.5-0.5` = both score 0.5
- `0-0` = both score 0
- `BYE` = the bye player scores 1 automatically

### Pending result

Use `null` for a match whose result has not yet been entered.

Do **not** treat `0-0` as pending.

## Scoring Rules

For standings:

- win = 1 point
- draw = 0.5 point
- loss = 0 points
- double forfeit / `0-0` = 0 points each
- bye = 1 point

## Buchholz Tiebreak

Buchholz is the sum of the current scores of a player's opponents.

Rules for this app:

- Only actual opponents count.
- A bye does **not** count as an opponent.
- A bye contributes `0` Buchholz.
- Pending matches are ignored until completed.

## Standings Sort Order

Sort standings using the following keys, in this exact order:

1. `score` descending
2. `buchholz` descending
3. `seed` ascending
4. `name` ascending

`seed` is the player's immutable registration order.
This guarantees deterministic results even when names are duplicated.

## Registration Seed

The first player added has `seed = 1`, the next has `seed = 2`, and so on.

Seed is used for:

- round 1 ordering
- deterministic ranking ties
- deterministic pairing fallback rules

## Bye Rules

When a round has an odd number of players:

- assign exactly one bye
- the bye player receives 1 point automatically
- the bye match is stored as a real match record with result `BYE`
- the bye player should be the **lowest-ranked eligible player** who has not yet received a bye
- if all remaining players have already received a bye, assign it to the lowest-ranked player

A bye is considered a completed pairing immediately.

## Round 1 Pairing Rule

Round 1 uses seed-based Swiss-style pairing.

### Procedure

1. Sort players by `seed` ascending.
2. If the number of players is odd, first assign a bye to the highest seed number player.
3. Split the remaining players into a top half and a bottom half.
4. Pair by index:
   - first of top half vs first of bottom half
   - second of top half vs second of bottom half
   - and so on

### Example with 8 players

Seeds `1..8` become:

- Board 1: 1 vs 5
- Board 2: 2 vs 6
- Board 3: 3 vs 7
- Board 4: 4 vs 8

### Round 1 colors

Assign colors deterministically as follows:

- on odd-numbered boards, the better seed gets White
- on even-numbered boards, the better seed gets Black

This creates basic color balance in round 1.

## Subsequent Round Pairing Rule

From round 2 onward, use standings-based Swiss pairing.

### High-level goals, in priority order

1. pair players by score as closely as possible
2. avoid repeat pairings if possible
3. respect color balance when possible
4. keep the process deterministic

### Pre-pairing order

Before generating a round:

1. compute current standings from all completed prior-round matches
2. sort players by the standings sort order defined above
3. remove any player assigned a bye for this round

### Score groups

Create score groups from the sorted standings order.

Example:

- score 3.0 group
- score 2.5 group
- score 2.0 group
- etc.

### Float rule

If a score group has an odd number of players or cannot be fully paired without conflict:

- float the **lowest-ranked** player in that group down to the next lower score group
- retry pairing the current group

If multiple retries are needed, continue floating the lowest-ranked player that makes the group solvable.

### Within-group pairing strategy

Within a score group, attempt to pair players using deterministic backtracking:

1. take the highest-ranked unpaired player in the group
2. try opponents in this preference order:
   - opponents from the same score group
   - closest ranking distance first
   - players not previously faced first
3. if a chosen pairing leads to a dead end later, backtrack and try the next candidate

### Repeat pairing rule

Use this two-pass approach:

#### Pass 1

Attempt to complete the round with **no repeated pairings**.

#### Pass 2

If no complete solution exists, allow repeated pairings, but choose the solution that minimizes the number of repeats.

## Color Assignment Rules

Color balancing is a secondary objective and must never block the round if a legal pairing exists.

For each paired player pair, assign colors using the following deterministic rules:

### Step 1: compute color imbalance

For each player:

`colorImbalance = whiteGames - blackGames`

Interpretation:

- negative value = player has had more Black games and prefers White
- positive value = player has had more White games and prefers Black

### Step 2: check streaks

Track each player's last two colors from actual played non-bye games.
Try to avoid giving a player the same color three times in a row.

### Step 3: assign colors

Use this priority order:

1. if one player strongly prefers White and the other strongly prefers Black, assign accordingly
2. if one assignment would create a three-in-a-row color streak and the other would not, choose the non-streak assignment
3. otherwise, give colors to improve total color balance
4. if still tied, use a deterministic fallback:
   - on odd-numbered rounds, higher-ranked player gets White
   - on even-numbered rounds, higher-ranked player gets Black

## Board Numbering

After pairings are created, assign board numbers starting from 1 in pairing order.
The bye pairing should appear last.

## Match Completion Rule

A round is complete when every non-bye match in that round has a non-null result.

## Tournament Completion Rule

The tournament becomes `completed` when:

- the current round equals `totalRounds`, and
- that round is complete

## Determinism Requirement

The pairing algorithm must produce the same output for the same tournament state every time.

That means:

- no random shuffling
- no dependence on object key order
- always use explicit sorting before candidate generation
