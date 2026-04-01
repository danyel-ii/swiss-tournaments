# Swiss Tournaments Technical Documentation

## Purpose

This document explains how the app is built, how information moves through it, and why the current programming choices make sense for this product.

For the visual architecture view, see [system_diagram.md](/Users/danyel-ii/SwissTournaments/documents/system_diagram.md).

The codebase is not a generic CRUD app. It combines:

- a React single-page application
- serverless API routes
- Neon Postgres persistence
- domain-heavy Swiss pairing logic
- derived tournament projections for analytics
- PWA support for venue/mobile use

The main design pattern is:

1. Keep tournament editing logic in the frontend domain layer.
2. Persist the full workspace snapshot to the backend.
3. Rebuild analytical projections on the server from that snapshot.
4. Expose both raw workspace state and derived historical/statistical views through separate API routes.

That split is one of the most important architectural choices in the app.

## Stack Overview

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4 through `@tailwindcss/vite`
- `vite-plugin-pwa` for installability/service worker support

Relevant files:

- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `vite.config.ts`

### Backend

- Vercel serverless functions using `@vercel/node`
- TypeScript/ES modules
- Neon serverless Postgres client via `@neondatabase/serverless`

Relevant files:

- `api/*.ts`
- `server/db.ts`
- `server/auth.ts`
- `server/http.ts`
- `server/library.ts`
- `server/workspace.ts`

### Domain / Business Logic

- Swiss tournament state transitions in `src/core/tournament.ts`
- standings, round state, tie-breaks, and stats helpers in `src/core/ranking.ts`
- pairing engine in `src/core/swissPairing.ts`
- optional blossom matching via `edmonds-blossom`

### Tooling / Quality

- Vitest for tests
- ESLint with TypeScript + React hooks rules
- Vite build pipeline
- runtime verification script in `scripts/verify-runtime.mjs`

## Runtime Architecture

At runtime, the app has three major layers:

### 1. Client UI and orchestration

`src/App.tsx` is the composition root for the application. It does not hold all domain logic directly. Instead, it orchestrates several focused hooks:

- `useAuth()` for session state
- `useTournament()` for mutable tournament workspace state
- `usePlayerLibrary()` for reusable players
- `usePlayerStats()` for cross-tournament statistics
- `useHeadToHead()` for pairwise player history
- `useInstallPrompt()` for PWA installation UX

This is a pragmatic React architecture:

- React components remain mostly presentational
- asynchronous state is isolated by concern
- the app avoids a global client-side state framework
- the dependency graph stays shallow and readable

### 2. Server API routes

The backend is split into small route handlers under `api/`:

- `api/auth/login.ts`
- `api/auth/logout.ts`
- `api/auth/session.ts`
- `api/workspace.ts`
- `api/player-library.ts`
- `api/player-stats.ts`
- `api/head-to-head.ts`
- `api/health.ts`

Each route is intentionally narrow. There is no monolithic backend service layer. That fits the deployment target and keeps the serverless functions independently understandable.

### 3. Database and derived projections

The database stores both:

- primary session/workspace state
- derived projection tables for analytics and history

This is the second key architectural choice.

The app does not compute long-term statistics directly from the live frontend state on every page view. Instead:

- the client saves the whole tournament workspace snapshot to `workspaces.payload`
- the server synchronizes projection tables from that snapshot using `syncWorkspaceProjection()`
- library/statistics/head-to-head endpoints query those projection tables

This reduces coupling between:

- live tournament editing
- reusable player identity
- historical analytics

## Information Flow

## A. App bootstrap

Startup path:

1. `src/main.tsx` registers the PWA service worker with `registerSW({ immediate: true })`.
2. React mounts `App` inside `StrictMode`.
3. `I18nProvider` initializes language from local storage and provides translations through context.
4. `App` starts loading auth, workspace, and derived views.

Important implication:

- language is local-browser preference state
- auth/workspace/statistics are server-backed state

The app deliberately keeps those concerns separate.

## B. Authentication flow

Frontend:

- `useAuth()` calls `GET /api/auth/session` on mount
- login submits `POST /api/auth/login`
- logout submits `POST /api/auth/logout`

Backend:

- `server/auth.ts` owns cookie parsing, password verification, throttle logic, session lookup, and session cookie creation
- session cookies are `HttpOnly`, `SameSite=Strict`, and `Secure` in production

Data path:

1. User submits username/password.
2. `api/auth/login.ts` validates request shape.
3. `server/auth.ts` checks:
   - username allowlist from `server/config.ts`
   - password hash from environment variables
   - rate limit / login throttle state
4. On success, a random session id is generated and inserted into `sessions`.
5. A cookie named `swiss_session` is attached to the response.
6. Later API calls identify the user via `requireUsername()`.

Why this choice works:

- simple organizer-only access control
- no OAuth complexity
- explicit allowlisted users
- low operational overhead
- adequate security posture for a small specialized internal tool

Tradeoff:

- user management is static and environment-driven, not self-service

## C. Tournament workspace flow

This is the core application loop.

### Client-side state model

`useTournament()` uses `useReducer` and a domain reducer over `TournamentCollection`.

Important actions:

- `CREATE_TOURNAMENT`
- `SELECT_TOURNAMENT`
- `ADD_PLAYER`
- `RENAME_PLAYER`
- `REMOVE_PLAYER`
- `SET_TOTAL_ROUNDS`
- `SET_PAIRING_ALGORITHM`
- `START_TOURNAMENT`
- `SET_MATCH_RESULT`
- `GENERATE_NEXT_ROUND`
- `RESET_TOURNAMENT`

The reducer delegates state transitions to pure-ish domain helpers in `src/core/tournament.ts`.

That is a strong programming choice because it keeps business rules out of JSX.

### Persistence model

Persistence is snapshot-based, not command-based.

`useTournament()`:

- loads once with `loadTournamentCollection()`
- serializes the full state with `JSON.stringify`
- compares against `lastSyncedPayloadRef`
- saves by `PUT /api/workspace` when the snapshot changes

This means the backend is not asked to execute each domain action individually. Instead, the frontend is trusted to produce a valid tournament snapshot, and the backend normalizes/stores it.

Why this choice makes sense here:

- tournament editing is highly interactive
- most business logic is deterministic and local
- optimistic local updates feel immediate
- server API stays small
- persistence code remains straightforward

Tradeoff:

- the backend is less authoritative over each mutation
- conflict handling for true multi-user simultaneous editing is minimal

This app is effectively optimized for a single organizer workflow, which matches the product.

### Workspace API behavior

`api/workspace.ts` supports:

- `GET`: load workspace payload from `workspaces`
- `PUT`: save normalized workspace payload
- `DELETE ?scope=all`: clear tournament workspace plus projections
- `DELETE ?tournamentId=...`: remove a single tournament from the collection

Key implementation details:

- `normalizeTournament()` and `normalizeCollection()` defend against malformed payloads
- `setNoStore()` disables caching
- `requireTrustedOrigin()` blocks cross-origin writes by checking `Origin`/`Referer` against `Host`
- `requireUsername()` guards all routes

## D. Statistics and player library flow

The analytics side is built on server-side projections, not on ad hoc client aggregation.

### Why projection tables exist

The saved workspace JSON is easy to persist but awkward to query for:

- player history across tournaments
- head-to-head comparisons
- bye history
- aggregate scoring summaries
- per-round progression

To solve that, `syncWorkspaceProjection()` in `server/library.ts` denormalizes tournament snapshots into relational tables:

- `tournament_records`
- `tournament_player_entries`
- `tournament_match_entries`
- `player_library`

This is a hybrid model:

- JSON snapshot for the source of truth used by the app UI
- relational projections for query-friendly reporting

That is a very practical compromise.

### Projection sync flow

Whenever `PUT /api/workspace` succeeds:

1. the workspace JSON is upserted into `workspaces`
2. `syncWorkspaceProjection(username, payload)` runs
3. per-tournament projection rows are deleted and rebuilt
4. reusable library player identities are ensured/upserted

This makes workspace save the synchronization boundary for the entire system.

Consequences:

- analytics always derive from persisted workspace state
- statistics are eventually consistent with the latest successful save
- the frontend does not need a second write path to maintain analytics tables

### Library semantics

`player_library` stores reusable identities per username.

Key behavior:

- players are normalized by trimmed/lowercased name
- a tournament player may link to an existing `libraryPlayerId`
- otherwise the server can create/reuse a library entry by normalized name
- deletion from the library is soft-hide behavior, not history erasure

That is a smart choice because it preserves historical linkage while letting organizers clean up active lists.

### Stats and head-to-head routes

The client hooks call:

- `GET /api/player-library`
- `DELETE /api/player-library?playerId=...`
- `GET /api/player-stats`
- `GET /api/player-stats?playerId=...`
- `DELETE /api/player-stats?playerId=...`
- `GET /api/head-to-head?leftPlayerId=...&rightPlayerId=...`

The frontend deliberately treats statistics as read-mostly derived data.

That keeps editing responsibilities separated:

- workspace routes mutate tournament state
- stats/library routes expose curated historical views

## E. Pairing and standings flow

The domain-heavy part of the app lives in `src/core/`.

### Tournament state transitions

`src/core/tournament.ts` governs:

- creating tournaments
- adding/removing/renaming players
- locking pairing algorithm and rounds after start
- starting tournaments
- setting results
- generating next rounds
- resetting tournaments

This file encodes product rules such as:

- setup-only changes for total rounds and pairing algorithm
- late entries join on the next round once a tournament is running
- removing players after start becomes a drop-after-current-round style operation
- tournament completion depends on current-round completion and total rounds

### Ranking and tie-breaks

`src/core/ranking.ts` provides derived tournament views such as:

- current round matches
- eligible players by round
- standings
- Buchholz
- player color history
- player stats summaries used elsewhere

This separation is good engineering discipline:

- `tournament.ts` mutates state
- `ranking.ts` derives meaning from state

### Pairing engine

`src/core/swissPairing.ts` supports two pairing modes:

- `greedy`
- `blossom`

The code scores candidate pairings using factors such as:

- repeat pairings
- score gap
- rank gap
- color balance
- color streak avoidance

The blossom path uses `edmonds-blossom` to compute a high-quality graph matching over weighted edges. The greedy path acts as a simpler fallback/alternative.

This is an intentionally sophisticated choice for a tournament app. It suggests the project values pairing quality, not just producing any legal pairing quickly.

Why this split is strong:

- greedy is simpler and robust
- blossom can improve pairing quality on larger fields
- fallback behavior reduces operational risk if perfect matching is not available

## Database Model

The schema in `db/schema.sql` is small but purposeful.

### Primary tables

- `sessions`
  - session id, username, expiry
- `login_throttles`
  - brute-force mitigation by hashed username/ip scopes
- `workspaces`
  - one JSON workspace payload per organizer

### Projection tables

- `player_library`
  - reusable player identity catalog
- `tournament_records`
  - per-tournament metadata
- `tournament_player_entries`
  - player snapshots inside each tournament
- `tournament_match_entries`
  - match snapshots inside each tournament

This structure indicates the app values:

- operational simplicity for live editing
- analytical flexibility for history/statistics

If the project had chosen a fully normalized write model from the start, mutation complexity would have gone up significantly.

## Frontend Design Choices

### Hook-oriented orchestration

The app prefers focused hooks over a heavy state manager like Redux, Zustand, or React Query.

Reasons that fit this codebase:

- small number of remote resources
- custom mutation semantics
- domain reducer already captures important transitions
- server state is tightly coupled to app-specific flows

This is reasonable. Adding a generic state framework would likely increase abstraction cost more than it would help.

### Presentational component split

The component tree under `src/components/` is organized by user-facing domain sections:

- controls
- pairings
- standings
- player list
- statistics
- tournaments directory
- live view

This improves maintenance because feature boundaries match screen boundaries.

### Internationalization

The app uses a lightweight in-house i18n layer:

- translations stored in `src/i18n-data.ts`
- context provider in `src/i18n.tsx`
- preference persisted in local storage

Why this is a sensible choice:

- only two languages
- static UI strings
- no complex runtime translation loading
- low dependency footprint

## API and Security Posture

Security in this app is pragmatic rather than enterprise-heavy.

Implemented controls include:

- organizer allowlist
- hashed password verification via environment variables
- `HttpOnly` session cookie
- `SameSite=Strict`
- `Secure` in production
- login throttling by username and IP
- same-origin write protection via `requireTrustedOrigin`
- `no-store` caching headers on sensitive routes

This is a solid fit for a private organizer tool on Vercel.

Notable constraints:

- no RBAC
- no CSRF token layer beyond same-origin checks
- no collaborative locking/version-conflict model
- no audit/event log

These are acceptable tradeoffs for the current use case, but they are the main places that would need rework if the app grows into a multi-operator platform.

## PWA and Mobile Decisions

`vite.config.ts` configures `vite-plugin-pwa` with:

- standalone display mode
- portrait orientation
- explicit icons/assets
- auto-update registration

That lines up with the product’s venue use case:

- phones at chess events
- intermittent connectivity tolerance
- installable app-like feel
- reduced friction during live round management

The `useInstallPrompt()` hook and mobile-specific `Live View` also confirm that mobile operation was a first-class design target, not an afterthought.

## Testing and Verification

Current verification layers include:

- domain tests in `src/core/ranking.test.ts`
- export and utility tests
- runtime smoke verification in `scripts/verify-runtime.mjs`

This testing strategy emphasizes:

- correctness of tournament rules
- correctness of exported representations
- production-like route validation

That is the correct place to spend test effort in this app. UI cosmetics matter, but pairing correctness and data integrity matter more.

## Why These Programming Choices Were Made

Several choices stand out as intentional and good for this product.

### 1. Client-side domain reducer instead of backend-first mutations

Why:

- immediate UX
- fewer network round trips
- deterministic state transitions
- easier live-operation workflow

What it costs:

- weaker multi-user concurrency guarantees

### 2. Snapshot persistence plus relational projections

Why:

- simple writes
- rich reads
- avoids forcing the UI into a fully relational editing model

What it costs:

- projection sync complexity on save
- analytics are derived, not directly edited

### 3. Serverless API on Vercel

Why:

- natural fit with a Vite frontend deployment
- low infrastructure overhead
- enough backend capability for auth, persistence, and stats

What it costs:

- less control over long-running/background workflows
- architecture assumes request/response scale, not persistent workers

### 4. Neon Postgres

Why:

- relational queries for statistics/head-to-head
- JSONB support for workspace snapshots
- easy serverless integration

What it costs:

- database becomes responsible for both document-like and relational workloads

### 5. Lightweight in-house i18n and state management

Why:

- fewer dependencies
- easier local reasoning
- appropriate scale for the project

What it costs:

- fewer batteries-included features than larger frameworks

## Current Strengths

- Clear separation between mutation logic and derived analytics
- Strong domain-centric core for tournament rules
- Good fit between deployment model and backend complexity
- Query-friendly reporting design without overcomplicating live writes
- PWA/mobile-conscious product architecture
- Security posture proportionate to organizer-only use

## Current Architectural Limits

- No true multi-user synchronization model
- Workspace save rewrites can become a contention point if collaboration is added
- Projection rebuild-on-save may become more expensive as history grows
- Auth/user management is static and environment-bound
- The backend trusts normalized client snapshots more than a command-validated domain API would

## If This App Evolves Further

The most likely future pressure points are:

### Multi-operator concurrency

Would likely require:

- optimistic versioning
- mutation timestamps or revision ids
- conflict detection or locking

### Larger historical datasets

Would likely benefit from:

- more incremental projection sync
- background jobs
- precomputed aggregates or materialized views

### More flexible admin/auth

Would likely require:

- database-backed users
- role model
- password reset / account management

## Summary

This app is built around a strong central idea:

- tournament editing should be fast and local-feeling
- persistence should be simple
- analytics should be queryable and historically stable

The chosen stack supports that well:

- React + TypeScript + Vite for a fast operator UI
- Vercel serverless routes for low-friction backend logic
- Neon Postgres for both snapshot storage and derived relational queries
- domain modules that encode tournament rules directly in code
- PWA support for real-world tournament floor usage

The codebase is opinionated in the right places. It prioritizes operational clarity and domain correctness over framework sprawl. For the current product shape, that is a sound engineering choice.
