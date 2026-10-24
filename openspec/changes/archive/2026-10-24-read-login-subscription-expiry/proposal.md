# Read subscription expiry during credential login

## Why

Credential login currently imports OAuth material but drops subscription dates. Reuse the logged-in session to read the same entitlement endpoint used by tool-mmo, without another login or token refresh. Prefer the upstream expiry; use an original payment/period-start timestamp plus the operator-requested 30 days only when expiry is absent. Never round-trip tool-mmo's reverse-derived billing date.

## What Changes

No database migration, routing setting change, background polling, or payment action is needed. Existing populated dates are preserved because the current schema cannot distinguish manual dates from automatic dates.
