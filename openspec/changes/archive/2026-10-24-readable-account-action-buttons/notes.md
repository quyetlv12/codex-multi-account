# Verification

- Labels: 14px / 700; View details uses the same typography.
- Under 18rem available action width, use one column to keep labels inside buttons.
- 23 existing account action/card unit tests passed; focused ESLint and production build passed.
- Light/dark browser checks passed across 320, 360, 375, 390, 768, 1024, 1280, 1440, 1600 and 1920px, both local preview and installed static assets on port 2455. APIs fully mocked; no real account actions executed.
- Change strict validation and all 57 main specs passed (pre-existing non-strict warnings remain).
- Reviewed desktop light and mobile dark screenshots. Deployed static files without restart; retained older hashed assets. Backup: /Users/quyetdev/.codex-lb/backups/web-readable-action-labels-20261024-135731
- No database, credentials, routing settings or backend runtime changes.
