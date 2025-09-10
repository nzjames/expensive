# Architectural Decisions (ADRs, lightweight)

Dates are ISO‑8601 in repo time; update entries as changes land.

## 2025‑09‑07

- Adopt Zod for all API inputs (create, update, key query params).
  - Rationale: strong validation + coercion with small footprint; avoids silent data drift.

- Enforce per-table column whitelists for updates.
  - Rationale: prevent accidental/invalid updates; encode invariants.

- Keep `rrule` derived from cadence/anchor, not directly editable.
  - Rationale: single source of truth; avoids invalid recurrence state.

- SQLite PRAGMAs on open: `journal_mode = WAL`, `foreign_keys = ON`.
  - Rationale: safer concurrency and integrity.

- Env‑based DB path via `DATABASE_URL` with sane default.
  - Rationale: test isolation and deploy flexibility.

