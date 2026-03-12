# Paste Into Codex

Build a complete browser-based **Swiss Chess Tournament** app using the markdown spec files in this folder.

Read and follow these files in order:

1. `00_START_HERE.md`
2. `01_PRODUCT_REQUIREMENTS.md`
3. `02_DOMAIN_RULES_SWISS.md`
4. `03_DATA_MODEL_STATE.md`
5. `04_UI_UX_SPEC.md`
6. `05_TECHNICAL_ARCHITECTURE.md`
7. `06_IMPLEMENTATION_TASKS.md`
8. `07_ACCEPTANCE_TESTS.md`

Requirements summary:

- React + TypeScript + Vite + TailwindCSS
- local-only app with `localStorage` persistence
- add/remove players before start
- choose total rounds
- generate round 1 pairings
- manually enter results using only `1-0`, `0-1`, `0.5-0.5`, `0-0`
- auto-create `BYE` when the player count is odd
- calculate standings after each result change
- use score + Buchholz for ranking
- generate later rounds using the simplified deterministic Swiss rules in the docs
- avoid repeat pairings if possible
- no backend
- no external pairing service
- unit tests for core tournament logic

Important clarification:

- `0-0` is a valid completed result and must not be used as the placeholder for an unentered result
- pending results should be stored as `null`

Please implement the full repository, keep the core logic pure and well-tested, and make the UI clean and practical for live tournament use.
