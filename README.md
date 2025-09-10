# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

Project context for assistants and contributors: see `docs/AI_CONTEXT.md` and `docs/DECISIONS.md`.

## Testing & DB isolation

- Vitest (server) uses a temp SQLite DB per worker; migrations run automatically. The temp DB is deleted after tests.
- Playwright e2e starts the preview server with a temp DB as `DATABASE_URL`; migrations run before the server starts and the temp DB is deleted after tests.
- Your primary DB (e.g. `./expense-dev.db` or `./expense-prod.db`) is not touched by tests.

## Backup

- Create a WAL-safe backup of the current DB with:
  - `npm run db:backup` (uses `DATABASE_URL` or defaults to `./expense-dev.db`)
- Backups are written to the repo root as `sqlite.YYYYMMDD-HHmmss.db` (or derived from your DB filename).
