# Implementation context

Credential login is an explicit attempt to authenticate an account again. It uses the existing account repository replacement path independently of the generic file-import setting. This preserves account IDs, account-owned settings and history, while protecting different upstream identities and ambiguous workspaces.

Example: a synthetic existing account marked `reauth_required` can receive fresh synthetic tokens through `/api/accounts/credential-login` and becomes active without adding a second account. Ordinary `/api/accounts/import` still respects `import_without_overwrite`.

Standalone desktop scripts and generated bundles were removed reversibly from the web workspace. The original macOS web launcher and its tracked icons remain.

Verification uses a temporary test database and a mocked credential exporter. No real login, refresh, inference or 9Router operations are performed. Deployment requires a private backup and a graceful restart; report this separately from local test results.
