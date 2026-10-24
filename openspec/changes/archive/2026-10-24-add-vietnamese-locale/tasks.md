- [x] Translate the full locale bundle and register Vietnamese.
- [x] Add the language option and Vietnamese date/number formatting.
- [x] Verify locale parity, interpolation, selectors, persistence, and representative UI.
- [x] Run focused tests, lint and production build; review the diff.
- [x] Deploy static assets safely and verify the live UI without restarting the service.

Verification: all 1,178 tests across 151 frontend files and 5 Playwright scenarios
pass; lint and production build pass. All 57 main specs validate successfully.
Browser coverage includes desktop/mobile, light/dark, fresh Vietnamese
default, stored English preference, language persistence, account cards/detail
modal, and routing settings. Visible Brave live verification confirms Vietnamese
and reload persistence. The live HTML entry and its 21 referenced assets match
the production build. Static rollback backup is stored privately at
`~/.codex-lb/backups/vietnamese-locale-20261024`; no backend restart or data changes.
