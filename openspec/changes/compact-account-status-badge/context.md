# Verification

The Accounts card header now keeps the plan badge and a compact status icon in one right-aligned group. The status icon retains the localized label in `aria-label` and `title`; list, dashboard, API-key, and detail call sites continue using the existing labeled badge because `iconOnly` is opt-in.

Focused AccountCard and AccountListItem tests passed (21 tests). Frontend typecheck, lint, production build, and `git diff --check` passed. The live dashboard was reloaded after copying the built static assets to the uv installation; aggregate DOM and accessibility inspection confirmed eight card badge groups, icon-only status images, and no visible status text in the badge groups. A static backup was created at `/Users/quyetdev/.codex-lb/backups/account-card-status-badge-20261024T034351Z`. No database, encryption key, account credentials, inference request, or service restart was used.

Strict `openspec validate --specs` could not run because the `openspec` CLI is not installed on PATH.
