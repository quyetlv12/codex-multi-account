# Login subscription capture

The operator requested a fixed 30-day term from an original payment date. Prefer
the upstream expiry instead when available. For example, payment on 2030-01-31 at
midnight Asia/Ho_Chi_Minh yields expiry on 2030-03-02 at local midnight
(2030-03-01T17:00:00Z), rather than a calendar-month increment.

The integration reuses the existing GPT Tool login session and its newly issued
OAuth access token. Entitlement parsing was compared with tool-mmo's
`modules/twofa/session_phase.py`; account identity handling was compared with
`modules/browser-login/test_workspace_verification.py`. The default workspace
alone is not proof of account identity. Reverse-derived billing dates in
tool-mmo are deliberately excluded.

This is an internal web endpoint, not a guaranteed public contract. The local
Postman simulation uses synthetic fixtures; it proves client behavior, not that
ChatGPT currently returns these fields for every account. Timeouts, redirects,
unavailable metadata, and conflicting identities leave the date unknown without
failing login. Populated dates are preserved because the existing schema does
not distinguish dates entered by operators from dates captured automatically.

Verification completed on 2026-10-24:

- 70 backend tests passed across subscription parser, credential helper,
  credential-login API, stored subscription expiry and expiry routing.
- Postman simulation: four synthetic HTTP requests covered direct expiry,
  payment plus 30 days, HTTP 503, and redirect rejection. No redirect followed.
- 11 account-card unit tests and two Playwright tests at 1440px passed,
  including light/dark countdown presentation and detail modal. Screenshot
  review used synthetic accounts.
- Ruff, focused `ty` checks and `git diff --check` passed.
- The change delta passed strict OpenSpec validation before archive. Full-repo
  strict validation reported existing placeholder-purpose and overlong-requirement
  warnings across 55 of 57 specifications. These unrelated specifications were
  not rewritten; the account-identity placeholder purpose was completed.

No live login, refresh, inference or payment was performed. Runtime backend
installation is pending an idle restart window because this Codex session uses
the running load balancer. A private backup and four-file deployment bundle were
prepared under `.codex-lb/backups/login-subscription-20261024-142104/`, with SQLite
`quick_check=ok`, prior runtime files, hashes, and a rollback runbook. Runtime,
routing settings, Codex provider configuration and 9Router were not modified.
