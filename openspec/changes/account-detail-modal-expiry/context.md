# Context

Implementation brief (medium): React/Vite, Tailwind and existing Radix Dialog. Reuse AccountDetail and its action callbacks; keep list view intact. Match the supplied calendar row with a restrained tinted surface, prominent remaining days, and a wrapping timestamp. Maintain navy dark and light themes.

Acceptance: View details targets the clicked account in a modal; Close/Escape restore focus and retain cards. Existing detail editing and confirmation dialogs remain usable. Future expiry uses ceiling of remaining 24-hour periods, with a distinct less-than-one-day label; elapsed dates are expired. Missing dates stay unknown. A seven-day visual warning does not alter routing. Timestamp honors date/time preferences. No secrets, inference, login, live DB, deployment, or restart required.

Example: at 2026-01-01 12:00 UTC, expiry 2026-01-31 12:00 UTC shows 30 days. A missing plan expiry never falls back to quota reset or token expiry.

Verification: bun run typecheck; bun run lint; bun run build; focused Vitest account suites; git diff --check; isolated preview with synthetic fixtures at desktop and 390px, in both themes. OpenSpec CLI availability must be reported honestly.
