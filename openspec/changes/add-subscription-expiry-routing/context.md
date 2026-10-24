# Local deployment and verification

The expiry switch appeared to revert because the development dashboard called the
installed 1.24.0 backend, which did not return the new expiry settings. Deploying
the matching backend and frontend resolved the persistence mismatch. The expiry
window also has its own save label, and a UI regression checks the switch payload.

Verified locally on 2026-10-24:

- Backend expiry routing, account persistence/API, and migration suites: 35 passed,
  5 PostgreSQL-only tests skipped.
- Frontend routing settings suite: 33 passed.
- Backend Ruff, frontend lint, type checking, and production build passed.
- Brave against port 2455: enable, reload, change window to 14, save, restore 7,
  disable, reload. Both settings persisted. Final state is disabled with 7 days.
- Existing capacity-weighted routing and secondary earlier-reset preference remain.

The wheel was installed with `uv pip install --no-deps --reinstall` into the
existing managed tool environment. The LaunchAgent was restarted once. Live
settings and UI persistence were verified; no inference request was made for
testing. No subscription expiry was inferred or filled automatically.

## Backup and rollback

Private backup directory:
`~/.codex-lb/backups/subscription-expiry-live-20261024-0802/`

It contains a consistent SQLite backup, encryption key, LaunchAgent plist, the
previous complete tool environment (`tool-env/`), and the deployed wheel. The
directory is owner-only; keep these files private. SQLite integrity checks passed.

If rollback becomes necessary, stop `com.codex-lb.local` before replacing the
environment. Preserve the current environment under a separate path, then copy
`tool-env/` back to `~/.local/share/uv/tools/codex-lb` and restart the
LaunchAgent. Restore to that exact path because installed script paths depend on
it. The additive database columns can remain when rolling back the application.
Do not restore the database snapshot routinely: that would discard writes made
after the backup. Any database restore requires a fresh backup of current data
and a deliberate decision about those writes. Restore the encryption key together
with a matching database only if that is actually required.

Do not alter the Codex provider URL, refresh shared tokens for testing, or touch
the separate 9Router database during deployment or rollback.
