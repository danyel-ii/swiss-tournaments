# START HERE

You are building a complete browser-based **Swiss chess tournament app**.

Read these files in order and implement the app accordingly:

1. `01_PRODUCT_REQUIREMENTS.md`
2. `02_DOMAIN_RULES_SWISS.md`
3. `03_DATA_MODEL_STATE.md`
4. `04_UI_UX_SPEC.md`
5. `05_TECHNICAL_ARCHITECTURE.md`
6. `06_IMPLEMENTATION_TASKS.md`
7. `07_ACCEPTANCE_TESTS.md`

## Mission

Build a working app that lets a tournament organizer:

- add and remove players before the tournament starts
- choose the number of rounds
- generate round 1 pairings
- manually enter results for each board using only:
  - `1-0`
  - `0-1`
  - `0.5-0.5`
  - `0-0`
- automatically recalculate standings after results are entered
- generate the next Swiss round pairings
- finish the tournament and display final standings

## Build Constraints

- Use **React + TypeScript + Vite + TailwindCSS**
- No backend
- Persist state in `localStorage`
- Keep all tournament logic in pure TypeScript modules under `src/core`
- Make the pairing and ranking logic deterministic
- Keep the UI simple, clear, and tournament-operator friendly
- Do not use any external pairing service

## Important Functional Clarification

The score `0-0` is a **valid completed result** and means both players receive 0 points.
It must **not** be used as the placeholder for an unentered result.
Use `null` for pending results.

## Definition of Done

The project is done when all of the following are true:

- `npm install` works
- `npm run dev` starts the app successfully
- a tournament can be run from start to finish in the browser
- results persist across page refreshes
- pairings update after each round
- standings use score + Buchholz tiebreak
- basic edge cases are handled
- the core logic has unit tests

## Delivery Expectations

Produce a complete repository with:

- readable code
- clear folder structure
- pure core logic
- responsive but simple UI
- deterministic Swiss pairing behavior
- tests for the pairing and ranking logic

When the docs leave room for minor implementation detail, choose the simplest robust option that stays consistent with all files in this pack.
