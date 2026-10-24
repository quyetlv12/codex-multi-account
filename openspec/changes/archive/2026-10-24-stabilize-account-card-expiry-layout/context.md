# Context

Some upstream account summaries expose a weekly quota without a reliable primary 5h window. The card must keep the expiry section at the same vertical offset as cards that render both quota rows so scanning remains stable across accounts. The reserved row is presentational only: it is invisible to users and assistive technology, and it does not fabricate a percentage or reset timestamp.

The account list's existing behavior remains unchanged; this applies only to the card layout.

## Verification and deployment

- Clean frozen Bun dependency install removed mixed React instances from the existing dependency directory; no package or lockfile changes.
- Component tests 4/4, scoped ESLint, repository typecheck, and production build passed.
- Production-preview and installed-static browser harness: 10/10 each, light/dark at five widths. All account API responses were mocked; unexpected API calls and external requests were blocked.
- Installed static index references `index-B0ybv8hT.js`; live index SHA256 `c3a44f8bd48f1925cf404fc178182b8be9b9bc337c9b6594ea5610ef0b6d5f66`. Server PID 60930 stayed unchanged.
- Before the clean install, a mixed-React bundle failed at runtime and was immediately rolled back. The final bundle passed the browser harness before and after installation.
- Static rollback: restore the original index and assets from `/Users/quyetdev/.codex-lb/backups/ui-static-20261024-account-card-layout`. No database, encryption key, account token, or routing changes.
- Rendered evidence: `frontend/test-results/live/expiry-layout-evidence.json` (ignored local artifacts).
- Strict change validation passed. Repository-wide strict spec validation is blocked by existing placeholder-purpose/long-requirement warnings in 55 capabilities.
