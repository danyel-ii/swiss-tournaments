# Swiss Tournaments Algorithm Deep Dive

## Purpose

This document explains the algorithms available in the app, how they work conceptually, and how they are implemented in the current codebase.

The core algorithmic areas are:

- round-one pairing generation
- Swiss round pairing generation
- pairing strategy selection: `greedy` vs `blossom`
- color assignment heuristics
- bye selection
- standings and tie-break computation
- tournament progression rules that affect pairing inputs

The pairing engine does not operate in isolation. It depends on ranking and eligibility rules, so this document covers the full algorithmic pipeline rather than only the matching step.

## Where the Algorithms Live

Main implementation files:

- `src/core/swissPairing.ts`
- `src/core/ranking.ts`
- `src/core/tournament.ts`
- `src/core/ranking.test.ts`

Supporting type definitions:

- `src/types/tournament.ts`

External dependency used by one pairing mode:

- `edmonds-blossom`

## Algorithm Inventory

The app currently exposes two user-selectable pairing algorithms:

- `greedy`
- `blossom`

Other important non-configurable algorithms in the system:

- round-one seeding and split pairing
- Buchholz tie-break computation
- standings ordering
- bye assignment
- color balancing and streak avoidance
- tournament rewind logic for corrected historic results

## End-to-End Pairing Pipeline

When a new round is generated, the algorithmic flow is:

1. Determine which players are eligible for the round.
2. Compute standings from completed games.
3. Select a bye player if the eligible count is odd.
4. Build candidate pairings from the remaining players.
5. Run the selected pairing engine:
   - `blossom` first if configured
   - otherwise `greedy`
6. If needed, allow repeats as a fallback.
7. Assign white/black colors to each chosen pair.
8. Emit round matches with board numbers.

That pipeline is implemented mainly in:

- `generatePairings()`
- `generateRoundOnePairings()`
- `generateSwissRoundPairings()`
- `generateSwissPairs()`

## 1. Round One Algorithm

Round one uses a dedicated algorithm rather than the general Swiss matching engine.

Implemented in:

- `generateRoundOnePairings(players)`

### How it works

Players are sorted by seed ascending. Then:

- if the player count is odd, the highest seed gets the bye
- the field is split into a top half and a bottom half
- players are paired positionally across halves
- color assignment alternates by board parity

Example structure:

- top half: `1 2 3 4`
- bottom half: `5 6 7 8`
- pairings:
  - `1 vs 5`
  - `2 vs 6`
  - `3 vs 7`
  - `4 vs 8`

But white/black is alternated:

- odd boards: better seed gets white
- even boards: better seed gets black

### Why this algorithm exists

Round one has no prior score, no repeat constraints, and no color history. A simpler seeded opening-round structure is both standard and predictable.

### Implementation notes

- the function creates `Match` objects directly
- byes are encoded as `isBye: true` and `result: 'BYE'`
- board numbering is stable and sequential

### Tested behavior

The tests verify:

- correct even-player split pairing
- odd-player bye assignment
- expected board ordering

## 2. Player Eligibility Algorithm

Before any Swiss round is paired, the system determines who is eligible.

Implemented in `src/core/ranking.ts`:

- `hasPlayerEnteredByRound()`
- `isPlayerEligibleForRound()`
- `getPlayersEnteredByRound()`
- `getPlayersEligibleForRound()`

### Rules

A player is eligible for round `r` if:

- `enteredRound <= r`
- and either `droppedAfterRound === null`
- or `droppedAfterRound >= r`

This supports two important tournament behaviors:

- late entrants join from the next round instead of retroactively appearing
- dropped players remain part of tournament history without appearing in future pairings

### Why this matters algorithmically

The pairing algorithm does not work over all registered players. It works over the eligible subset only. That is why tournament state management and pairing logic are tightly connected.

## 3. Standings Algorithm

Swiss pairing depends on current standings, so standings are computed before each non-round-one pairing.

Implemented in `src/core/ranking.ts`:

- `getPlayerScore()`
- `getPlayerOpponents()`
- `getPlayerColorHistory()`
- `getPlayerBuchholz()`
- `getStandings()`
- `getPlayerStats()`

### Score calculation

`getMatchPointsForPlayer()` maps results as follows:

- `1-0`: white gets `1`, black gets `0`
- `0-1`: black gets `1`, white gets `0`
- `0.5-0.5`: both players get `0.5`
- `0-0`: both players get `0`
- `BYE`: the bye recipient gets `1`
- `null`: incomplete games contribute `0`

Then `getPlayerScore()` sums all match points for a player.

### Buchholz calculation

Buchholz is computed as:

- sum of the completed scores of completed opponents
- byes do not contribute an opponent

This is implemented by:

1. filtering to completed matches
2. collecting opponent ids from non-bye completed matches
3. summing each opponent’s completed score

### Standings ordering

`compareStandingSort()` sorts by:

1. score descending
2. Buchholz descending
3. seed ascending
4. if still tied, current implementation effectively preserves input order because the comparator returns `0`

The user-facing documentation says name is a later tie-break, but the code path here does not explicitly compare names in `compareStandingSort()`. The rank assignment is therefore determined by the sorted array produced from score, Buchholz, and seed.

### Why this matters for pairings

Swiss pairing quality depends on current rank and score group structure. The pairing engines use `PlayerStanding` values rather than raw players, which means the ranking algorithm is a direct input to pairing selection.

### Tested behavior

The tests verify:

- score calculation for all supported result types
- Buchholz ignoring byes
- standings ordering by score, Buchholz, and seed

## 4. Bye Selection Algorithm

When an odd number of players is eligible, one player must receive a bye.

Implemented in:

- `selectByePlayer(players, matches, round)`

### Rules

Round 1:

- the highest seed receives the bye

Later rounds:

- sort players by rank descending, so the lowest-ranked players are considered first
- pick the first player who has not already received a bye
- if every player has already received a bye, choose the lowest-ranked player anyway

### Why this is reasonable

This follows a common Swiss intuition:

- avoid giving repeated byes to the same player
- if a bye is required, push it toward the lower end of the standings when possible

### Tested behavior

The tests verify that a player does not receive a second bye when another lower-ranked eligible player is available.

## 5. Color Assignment Algorithm

Once a pair is chosen, the app still has to decide who gets white and who gets black.

Implemented in:

- `assignColors()`
- `scoreColorOption()`
- `getColorImbalance()`
- `wouldCreateThirdColor()`

### Color goals

The implementation tries to balance several objectives:

- satisfy each player’s color preference based on past imbalance
- avoid creating a third consecutive game with the same color
- reduce overall color imbalance
- use a deterministic fallback when preferences are otherwise equal

### Color imbalance

Color imbalance is defined as:

- `+1` for each prior white
- `-1` for each prior black

So:

- negative means the player has had more black and therefore prefers white
- positive means the player has had more white and therefore prefers black

### Third-color avoidance

`wouldCreateThirdColor()` checks the last two colors in the player’s history.

If the last two are already the same color, assigning that same color again incurs a penalty.

### Tuple scoring

Each white/black assignment option is scored by a tuple:

1. mutual preference satisfaction
2. streak penalty
3. balance penalty
4. fallback penalty
5. rank difference
6. round number

The lower tuple wins lexicographically.

### Fallback rule

The fallback rule is:

- on odd rounds, higher-ranked player prefers white
- on even rounds, higher-ranked player prefers black

That gives a deterministic tie-break instead of unstable random color assignment.

## 6. Greedy Pairing Algorithm

The `greedy` algorithm is one of the two selectable pairing engines.

Implemented in:

- `buildCandidatePairs()`
- `findMostConstrainedPlayer()`
- `scoreGreedyCandidate()`
- `buildGreedyPairingPlan()`

### High-level idea

This is a constraint-first heuristic matching algorithm.

At each step:

1. pick the most constrained unpaired player
2. build a ranked list of candidate opponents
3. choose the candidate that best preserves solvability and pairing quality
4. remove both players and continue

### Candidate construction

For each possible opponent, the algorithm computes:

- `repeatCount`
- `scoreGap`
- `rankGap`

Candidates are filtered:

- if repeats are not allowed, repeated pairings are excluded entirely

Candidates are initially sorted by:

1. smaller score gap
2. fewer repeats
3. smaller rank gap
4. lower opponent seed

### Most constrained player heuristic

`findMostConstrainedPlayer()` selects the player with the fewest valid opponents under the current repeat policy.

This is a classic heuristic. It tries to prevent dead ends by pairing the hardest player first.

### Candidate scoring

`scoreGreedyCandidate()` looks one step ahead.

It computes:

1. whether the remaining pool would leave the next player with zero candidates
2. the candidate’s score gap
3. repeat count
4. rank gap
5. opponent seed

This gives the algorithm limited look-ahead without turning into a full backtracking search.

### Strengths

- deterministic
- easy to reason about
- resilient on small and medium tournament fields
- avoids many bad choices through the constrained-player heuristic

### Limitations

- not globally optimal
- uses local heuristics rather than exhaustive optimization
- may miss a better full-round matching that a graph-based method would find

## 7. Blossom Pairing Algorithm

The `blossom` algorithm is the second selectable pairing engine.

Implemented in:

- `buildBlossomPairingPlan()`
- `scorePairEdge()`

External dependency:

- `edmonds-blossom`

### High-level idea

This mode models the round pairing problem as a weighted graph:

- each player is a node
- each possible pairing is an edge
- each edge gets a weight representing how desirable the pairing is

Then maximum-weight matching is used to choose a globally good set of disjoint pairings.

### Edge generation

For every pair of players:

- create an edge if the pairing is allowed under the current repeat policy
- assign a weight using `scorePairEdge()`

### Edge scoring

`scorePairEdge()` subtracts penalties from a large base score:

- repeat pairing penalty: `300000`
- score gap penalty: `abs(score difference) * 10000`
- rank gap penalty: `abs(rank difference) * 100`
- color penalty derived from the best available color assignment tuple

This means the algorithm strongly prefers:

- non-repeats
- players on similar scores
- players near each other in rank
- pairings with better color outcomes

### Matching step

The weighted edges are passed to `blossom(edges)`.

The library returns a partner index array. The implementation validates that:

- the result is an array
- every partner index is in range
- pairings are symmetric
- every player is matched exactly once

If validation fails, the plan is rejected.

### Why blossom is stronger

Unlike the greedy algorithm, blossom evaluates the round as a whole through graph matching. That makes it better at avoiding locally good but globally bad choices.

### Why greedy still exists

Because blossom is not the only concern:

- the project wants a simpler and more explainable fallback
- some edge cases may still fail to produce a usable matching
- the implementation deliberately preserves robustness over theoretical elegance

## 8. Pairing Strategy Selection and Fallback Logic

The app does not simply run the chosen algorithm once.

Implemented in:

- `generateSwissPairs()`

### Plan selection strategy

The engine tracks a `bestPlan`, where better means:

1. fewer repeat pairings
2. if tied, lexicographically smaller pair sequence

The tie-break is implemented by `comparePairSequence()`, which compares:

- rank and seed ordering of each pair

This keeps output deterministic.

### Blossom flow

If the selected algorithm is `blossom`:

1. try blossom with repeats forbidden
2. if a zero-repeat plan exists, return it immediately
3. otherwise try blossom with repeats allowed

### Greedy flow

After the blossom path, or directly if the algorithm is `greedy`:

1. iterate `allowRepeats = false`, then `true`
2. for each repeat policy, try several player-order attempts from `createAttemptOrders()`
3. keep the best plan found
4. if a zero-repeat greedy plan appears, return immediately

### Why multiple attempt orders exist

`createAttemptOrders()` perturbs the starting order before greedy matching.

This is a practical hedge against ordering bias. Greedy algorithms can be sensitive to input order, so the implementation tries several structured reorderings to improve the odds of finding a better plan without brute-force search.

### Failure mode

If no plan is found at all, the function throws:

- `Unable to generate Swiss pairings`

This is the hard failure boundary of the pairing engine.

## 9. Score Groups

The implementation groups players by score via `groupPlayersByScore()`, but then flattens those groups before matching:

- `const flattenedPlayers = [...scoreGroups.values()].flatMap((group) => group)`

This means score groups are used primarily to preserve a standings-oriented ordering, not to enforce hard group-by-group pairing barriers.

Practical consequence:

- the engine still strongly prefers same-score pairings because score gap penalties are large
- but it can cross score groups when needed

This is an intentional flexibility choice. It avoids brittle failures when strict group isolation would make pairing impossible.

## 10. Tournament Mutation Algorithms That Affect Pairing

The matching engine only works correctly because tournament state transitions preserve invariants.

Implemented in `src/core/tournament.ts`.

### Pairing algorithm selection lock

`setPairingAlgorithm()` only changes the algorithm while the tournament is in setup.

Why:

- changing pairing strategy mid-event can invalidate expectations and fairness assumptions

### Late entry handling

`addPlayer()` assigns:

- `enteredRound = 1` in setup
- `enteredRound = currentRound + 1` after the tournament starts

Why:

- no player is inserted retroactively into an already paired round

### Drop handling

`removePlayer()` behaves differently depending on state:

- before start: remove fully
- after start: set `droppedAfterRound = currentRound`

Why:

- preserve tournament history
- exclude the player from future eligibility

### Result correction rewind

`setMatchResult()` has two paths:

- current-round edit: update in place
- past-round edit: rewind tournament to that round and drop later rounds

That rewind behavior is algorithmically important. Once a past result changes, all later standings and pairings may be invalid, so the implementation truncates future rounds instead of trying to patch them incrementally.

### Next-round generation

`generateNextRound()` only proceeds if:

- tournament status is `in_progress`
- current round is complete
- current round is below total rounds

Then it appends the new round returned by `generatePairings()`.

## 11. Complexity and Practical Behavior

This codebase is optimized for practical tournament operation, not asymptotic purity.

### Greedy mode

Greedy has:

- pairwise candidate construction
- repeated filtering/sorting
- constrained-player search at each step

It is still practical for the tournament sizes this app targets.

### Blossom mode

Blossom introduces:

- complete edge construction over the active pool
- external maximum-weight matching computation

This is computationally heavier, but it gives stronger global pairing behavior and is appropriate for larger fields.

### Practical safeguards

The implementation includes several safety-oriented choices:

- repeat-avoidance first, repeat-allowance second
- multiple greedy attempt orders
- deterministic tie-breaking
- explicit validation of blossom output
- large-field test coverage to ensure pairing does not hang

## 12. What the Tests Lock In

The test suite in `src/core/ranking.test.ts` validates several critical guarantees:

- score handling for all result types
- Buchholz ignoring byes
- standings ordering by score/Buchholz/seed
- round-one pairing structure
- avoidance of repeats when a non-repeat solution exists
- bye assignment preference
- large-field round generation with late entrants
- blossom as an alternative pairing engine
- pairing algorithm locked after setup
- late entrants only joining future rounds
- dropped players staying in history but leaving future pairings
- rewind behavior when past results are corrected

This matters because it tells us which algorithmic properties are intentional and already protected by tests.

## 13. Design Tradeoffs

The algorithm design makes several pragmatic tradeoffs.

### Determinism over randomness

The app uses deterministic ordering, tuple comparison, and stable plan selection.

Benefit:

- easier debugging
- repeatable behavior

Cost:

- may reduce variety when multiple equally valid pairings exist

### Soft score-group preference instead of hard enforcement

Benefit:

- pairing remains possible in difficult fields

Cost:

- less strict adherence to rigid score-group-only matching

### Heuristic color balancing instead of formal optimization

Benefit:

- simpler implementation
- integrates cleanly into both greedy and blossom flows

Cost:

- color fairness is optimized heuristically, not proven optimal

### Frontend-hosted domain engine

Benefit:

- fast UI interactions
- simple persistence model

Cost:

- the backend is not the sole mutation authority

## Summary

The app’s algorithmic design is built around a layered Swiss pairing model:

- ranking computes the current competitive state
- eligibility decides who is pairable
- byes are assigned fairly with history awareness
- one of two pairing engines chooses opponents
- color heuristics decide white/black allocation
- tournament rules preserve consistency when entries, drops, and corrections occur

The two exposed pairing algorithms serve different purposes:

- `greedy` is a deterministic, constraint-first heuristic matcher
- `blossom` is a weighted graph-matching approach for better global pairing quality

The implementation is not a direct transcription of a formal Swiss rulebook. It is a practical tournament engine designed for:

- good pair quality
- robustness under real tournament edits
- deterministic behavior
- maintainable code

For this application, that is the right balance.
