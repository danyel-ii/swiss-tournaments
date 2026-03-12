# UI / UX Specification

## General UX Goals

The UI should feel like a practical tournament desk tool:

- readable at a glance
- low-friction for manual result entry
- minimal page navigation
- strong visual separation between setup, pairings, and standings

Build a **single-page app**.

## Main Layout

Use a simple responsive layout with these sections:

1. page header
2. tournament controls
3. player setup panel
4. current round pairings panel
5. standings panel
6. footer actions / reset area

On wide screens, pairings and standings can sit side-by-side.
On narrow screens, stack them vertically.

## Header

Display:

- app title: `Swiss Chess Tournament`
- tournament status badge:
  - `Setup`
  - `Round N of X`
  - `Completed`

Optional but useful:

- small line showing player count

## Tournament Controls Panel

### During setup

Show:

- tournament name input (optional, default is fine)
- number of rounds input or select
- start tournament button
- reset tournament button

### Behavior

- `Start Tournament` disabled if fewer than 2 players
- `Start Tournament` disabled if total rounds is invalid
- `Reset Tournament` shows a confirmation prompt

### After start

Once the tournament starts:

- lock round-count editing
- lock player deletion
- optionally disable tournament name editing too

## Player Setup Panel

### Visible in setup mode

Show:

- text input for player name
- add player button
- table/list of added players

Player list columns:

- seed
- name
- remove action

### Validation

- trim whitespace
- reject empty names
- allow duplicates but show a non-blocking warning below the input or near the duplicate entry

### After tournament start

The list remains visible, but add/remove controls are disabled or hidden.

## Current Round Pairings Panel

This is the main working area once the tournament starts.

### Table columns

- Board
- White
- Black
- Result

### Result entry behavior

For normal matches:

- use a dropdown/select with placeholder `Select result`
- choices:
  - `1-0`
  - `0-1`
  - `0.5-0.5`
  - `0-0`

For bye matches:

- show `BYE` in the result column
- disable editing

### Persistence behavior

When the user selects a result, save it immediately to app state and `localStorage`.
No separate save button is required.

### Completion indicator

The panel should clearly show whether the current round is:

- incomplete
- complete

A small summary line is enough, for example:

- `3 of 4 results entered`
- `Round complete`

## Standings Panel

Display a standings table that updates after every result change.

### Columns

- Rank
- Player
- Score
- Buchholz

Optional extra columns if easy:

- Seed
- Colors

### Sorting

Must match the standings sort order from the domain rules exactly.

## Primary Action Buttons

### Setup state

Primary button:

- `Start Tournament`

### In-progress state

Primary button:

- `Generate Next Round`

Button behavior:

- disabled until the current round is complete
- after the last round is complete, replace with a completed-state message or disable the button permanently

## Completed State

When the tournament is finished:

- show a clear `Tournament complete` banner
- keep final standings visible
- keep all pairings visible for the final round
- keep reset action available

## Suggested Components

Use components close to this structure:

- `TournamentHeader`
- `TournamentControls`
- `PlayerList`
- `PairingsView`
- `StandingsTable`
- `ActionBar`

## Visual Style

Use TailwindCSS.

Preferred style:

- white or light cards
- subtle borders
- medium spacing
- readable table headers
- obvious disabled states
- strong button contrast

Avoid overdesign.
This is an operator tool, not a marketing page.

## Empty States

### No players yet

Show a lightweight hint such as:

`Add at least 2 players to start a tournament.`

### Tournament not started yet

The pairings panel can show:

`Pairings will appear after the tournament starts.`

## Error Handling UX

Use lightweight inline feedback, not heavy modal workflows.

Examples:

- `Player name cannot be empty`
- `Rounds must be between 1 and 20`
- `All results must be entered before generating the next round`

## Accessibility Basics

Implement at least the following:

- semantic buttons and form fields
- labels for inputs
- keyboard-usable result selection
- visible focus states
- sufficient text contrast
