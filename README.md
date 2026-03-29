# Swiss Tournaments

User documentation for the live tournament app at `https://turnier.schachmagie.xyz`.

## What This App Does

This app is used to run Swiss-system chess tournaments with:

- organizer login
- cloud-saved tournaments
- live result entry
- standings and tie-breaks
- reusable player library
- cross-tournament player statistics
- markdown report download

The app is optimized for desktop and mobile use, including a compact `Live View` for use during a running event.

## Sign In

Access is limited to the configured organizer accounts.

To sign in:

1. Open `https://turnier.schachmagie.xyz`
2. Enter your username
3. Enter your password
4. Optionally enable `View password`
5. Sign in

If the app is opened on mobile, you may also see an install prompt so you can add it to the home screen.

## Main Navigation

The app is organized into these tabs:

- `Dashboard`: main tournament setup and management
- `Tournaments`: list of saved tournaments, create/open/delete tournaments
- `Live View`: simplified round-control screen for active play
- `Standings`: standings-focused view
- `Statistics`: cross-tournament player statistics

## Typical Tournament Workflow

### 1. Create or Open a Tournament

In `Tournaments`:

- use `Create Tournament` to start a new event
- use `Open Tournament` to continue an existing event

### 2. Configure the Tournament

In `Dashboard` setup mode you can set:

- tournament name
- total rounds
- pairing algorithm

Available pairing algorithms:

- `Greedy`
- `Graph Matching (Blossom)`

Important:

- the pairing algorithm is setup-only
- once the tournament has started, it can no longer be changed
- `Greedy` is the default
- if `Blossom` cannot produce a valid pairing, the app falls back to `Greedy`

Practical recommendation:

- use `Greedy` for small tournaments
- use `Graph Matching (Blossom)` for larger player fields

### 3. Add Players

Players can be added in two ways:

- type a new name and use `Add Player`
- add an existing person from `Player Library`

While the tournament is still in setup:

- players can be freely added, renamed, and removed

After the tournament has started:

- players can still be renamed
- new players join from the next round
- removing a player means they are dropped from the next round, not erased from history

This preserves pairings, standings, and historical statistics correctly.

### 4. Start the Tournament

Use `Start Tournament` once:

- at least 2 players are entered
- rounds are configured correctly

Round 1 pairings are then created automatically.

### 5. Enter Results

Results can be entered from:

- `Dashboard`
- `Live View`

`Live View` is the best choice during play because it reduces scrolling and keeps the current round front and center.

### 6. Generate the Next Round

Once all current-round results are entered, use `Generate Next Round`.

If a past-round result is corrected later:

- the tournament rewinds to that round
- all later rounds are removed
- those later rounds must then be generated again

## Live View

`Live View` is a simplified control screen intended for use at the venue.

It shows:

- the current round
- current pairings
- result entry controls
- the `Generate Next Round` action

On mobile, the main menu in `Live View` is collapsed behind the menu icon to reduce distractions.

## Standings and Tie-Breaks

Standings are calculated from recorded results.

The app currently records and uses:

- score
- Buchholz
- seed order
- color history
- byes

Standings are sorted by:

1. score
2. Buchholz
3. seed
4. name

## Reports

The app can export a tournament report as Markdown.

Use:

- `Download Report (.md)` / `Export Report`

This downloads a file named like:

- `my-tournament-report.md`

The report includes tournament details, pairings, results, and standings in a readable Markdown format.

## Player Library

The `Player Library` stores reusable players for the signed-in account.

Use it to:

- reuse players in new tournaments
- avoid retyping names
- keep player identity more consistent across tournaments

Deleting a player from the library:

- removes them from the reusable library list
- does not erase past tournament history
- does not erase statistics by itself

## Statistics

The `Statistics` tab shows cross-tournament player information derived from the saved database records.

Available statistics include:

- tournaments played
- games played
- total score
- score percentage
- wins, draws, losses
- win rate overall
- win rate by color
- white/black counts
- color imbalance
- longest color streaks
- byes and bye history
- average, best, and latest Buchholz
- completed vs partial tournaments
- undefeated tournaments
- late entries
- dropouts
- per-tournament final rank
- seed vs final placement
- opponent lists
- head-to-head summaries
- round-by-round score/Buchholz/rank progression

Deleting a player from `Statistics`:

- explicitly removes that player’s stored statistics record for the account

## Tournament Deletion and Data Deletion

### Delete a Single Tournament

From `Tournaments`, `Delete Tournament` removes that tournament from the active tournament workspace.

### Delete All Data

`Delete All Data` in the tournament directory clears:

- tournament/workspace data

It does **not** clear:

- player library
- player statistics

### Delete Statistics

Player statistics must be deleted explicitly from the `Statistics` tab.

### Delete Library Entries

Library players can be deleted explicitly from the `Player Library`.

## Multi-Device Use

The app is cloud-backed, but it is not a real-time collaborative editor.

Practical recommendation:

- avoid editing the same tournament on multiple devices at the same time

Why:

- the app saves tournament workspace state to the server
- simultaneous edits from multiple devices can overwrite each other
- this can lead to stale views or confusing behavior

Best practice:

- use one primary control device during live operation
- if you switch devices, refresh and reopen the tournament before continuing

## Mobile / Install

On supported mobile browsers, the app can be installed to the home screen.

Behavior:

- Android/Chromium browsers can show a native install prompt
- iPhone/iPad can show manual `Add to Home Screen` guidance

Installed use is helpful for:

- quick venue access
- full-screen use
- faster relaunch during events

## Current Operational Notes

- `Greedy` pairing is best suited to smaller events
- `Graph Matching (Blossom)` is the safer choice for larger events
- the app saves to the server; if something looks stale, refresh the page
- WhatsApp may cache old link previews for some time even after the site metadata changes

## Troubleshooting

### The next round does not generate

Check:

- all current-round results are entered
- the tournament has not already reached the final round
- the page is not stale from another device session

If needed:

- refresh the page
- reopen the tournament

### Statistics show an error

Try:

- refreshing the page
- reopening the `Statistics` tab
- checking whether the problem affects one player or all players

### A tournament looks wrong on another device

Likely cause:

- stale data from simultaneous device use

Recommended action:

- refresh on both devices
- continue from one device only

## Summary

Use the app like this:

1. create or open a tournament
2. configure name, rounds, and pairing algorithm
3. add players or reuse them from the library
4. start the event
5. enter results in `Live View`
6. generate rounds until complete
7. download the Markdown report
8. review long-term player performance in `Statistics`
