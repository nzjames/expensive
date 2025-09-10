# AI Context

This document captures the project’s intent, guardrails, and current state so assistants and contributors can move fast without over‑engineering.

## Purpose

Personal expense tracker focusing on recurring series and history, built to be fun to iterate on. We prefer small, pragmatic steps over heavy “best practice” rewrites. Introduce new concepts only when they deliver clear value now.

## Principles

- Keep it lean: make small, reversible changes.
- Validate before adding concepts or dependencies.
- Raise architectural blockers early; otherwise, evolve pragmatically.
- Favor boring, observable behavior over clever abstractions.

## Tech Stack

- SvelteKit 2 + Svelte 5 (runes default on)
- Tailwind CSS v4
- SQLite (better-sqlite3) with Drizzle ORM + migrations
- Zod for input validation (create, updates, and key query params)
- Vitest (browser + node) and Playwright

## Data Model (high level)

- `expenseSeries`: templates/series; fields include `name`, `status`, `frequencyInterval`, `frequencyUnit`, `amountCents`, `nextDate`, optional `rrule` (derived), etc.
- `expenseHistory`: occurrences; snapshot of series fields at the time, plus dates and status.

## Invariants & Validation

- Column whitelists for updates; no arbitrary column edits.
- Zod enforces:
  - `frequencyInterval >= 1`, `amountCents >= 0`
  - Dates are `YYYY-MM-DD` (empty string coerces to `null` for nullable fields)
  - Enums for `status`, `frequencyUnit`
- `rrule` is derived and synced when cadence/anchor changes (not directly editable by clients).

## API Behavior

- `POST /api/series`: Validates body; fills defaults; computes `rrule` if `nextDate` is set.
- `PUT /api/update`: Validates `{ table, id, column, value }`; enforces per-table column allowlists; recomputes `rrule` when updating cadence fields for series.
- `PUT /api/series/[id]`, `PUT /api/history/[id]`: Same per-table validators.
- `GET /api/occurrences`: Validates query params; supports `include`, `start`, `end`, `seriesId`.

## Ops Notes

- SQLite opened with `PRAGMA journal_mode=WAL` and `PRAGMA foreign_keys=ON`.
- Single Node process (better-sqlite3 is single-process friendly). Avoid multi-process writes.
- Backups: use `sqlite3 $DATABASE_URL '.backup backups/expense-YYYYMMDD.db'` (WAL-aware). Keep simple rotation.
- Job: `ensure-next` CLI ensures backfill and next occurrence; schedule via cron with file lock.

## Testing

- Unit: Validation schemas (`src/lib/validation.spec.ts`).
- Server tests: A separate Vitest project prepares a temp SQLite DB and runs migrations (`vitest-setup-server.ts`).
- E2E: Playwright basic visibility test; expand gradually.

## Current Focus (choose one at a time)

1) API tests (server):
   - POST /series defaults/coercion/errors, PUT /update whitelist + rrule sync, occurrences query validation.
2) SSR data for `/series` only:
   - Move fetches to `+page(.server).ts` with `depends()` + `invalidate()` after edits.
3) Backups + ops notes:
   - Add a simple backup script and README section.

## Assistant Guardrails

- Do not introduce new libraries or patterns without confirming value and scope.
- Keep changes localized; avoid repo-wide refactors unless asked.
- Prefer tests and docs as living context over large architectural shifts.
- Respect current behavior and UX; no hidden changes.

