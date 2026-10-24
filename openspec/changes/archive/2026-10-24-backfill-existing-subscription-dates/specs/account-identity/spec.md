## ADDED Requirements

### Requirement: Existing accounts can receive missing subscription dates
An explicit maintenance command SHALL read entitlement using existing access tokens without refreshing, logging in, following redirects, or calling inference. Only active Plus/Pro accounts with no stored date and a matching upstream account identity SHALL qualify. Missing or untrustworthy dates SHALL remain unknown. Dry-run SHALL be the default.

#### Scenario: A date becomes available
- **WHEN** the operator applies a backfill and upstream returns a trustworthy expiry for an eligible account
- **THEN** the dashboard API exposes the date without restarting the service

### Requirement: Backfill preserves current data
Before writing, the command SHALL create private backups of the database and encryption key and a conditional rollback journal. It SHALL update only expiry and only if the original encrypted access token, account identity, status, plan and empty date remain unchanged. Routing settings and all other account data SHALL remain unchanged. Output SHALL contain counts only, without account identifiers, credentials or upstream payloads.

#### Scenario: Concurrent edit or reauthorization
- **WHEN** the account date or credentials change while entitlement is being read
- **THEN** the backfill skips that account and preserves the newer data
