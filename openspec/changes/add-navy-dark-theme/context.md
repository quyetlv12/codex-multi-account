# Implementation brief

Reasoning target: medium. React/Tailwind dashboard with an existing Zustand theme store and Radix dropdowns. Use Taste's preserve-redesign guidance: retain Geist typography, layout, icons, and component foundation. Apply navy surfaces and one blue interaction accent, retaining semantic status colors.

Scope: frontend theme tokens and header selector only. No API, DB, authentication, routing, or live-service changes. Reuse the existing persisted Light/Dark/Auto store and settings labels. Example: choose Dark in the header, reload Accounts, and keep the navy card view.

Verification: focused Vitest theme/header/settings/chart tests, frontend typecheck/lint/build, diff check, and browser preview. Live service on port 2455 is outside this change's deployment scope.

## Verification evidence

- Frontend typecheck, ESLint, production build, and `git diff --check` passed.
- Five focused Vitest files passed, 23 tests total: theme-toggle, app-header, use-theme, use-chart-colors, and appearance-settings. jsdom reports its existing canvas fallback warning; real browser charts were also inspected.
- Browser preview at `http://127.0.0.1:4173`: navy account cards, Add account dialog, native form surfaces, dashboard charts, light-mode comparison, and persisted dark selection after reload checked. At 390x844 the theme selector remains visible next to the mobile menu and its selected radio state works; account cards fit the viewport. Temporary viewport override reset.
- Privacy-blurred screenshot retained locally as `codex-lb-ui-evidence/navy-dark-accounts.png` (not published).
- OpenSpec CLI is unavailable on PATH, so automated spec validation was not run. Change remains unarchived.
- No API changes, database migrations, account actions, real login/inference, installation, or live-service restart performed for this theme change.
