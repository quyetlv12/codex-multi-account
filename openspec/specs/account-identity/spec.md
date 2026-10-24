# account-identity Specification

## Purpose
Define account identity, workspace matching and reauthorization behavior so imports preserve the correct local account, history and subscription metadata.

## Requirements

### Requirement: Shared upstream workspace identities preserve account slots

The account import and OAuth add-account flows MUST preserve separate local account slots for different real email addresses even when the upstream token reports the same ChatGPT account id, with or without a workspace id.

Dashboard account summaries MUST expose and render the upstream ChatGPT account id as the primary workspace/account-slot context before falling back to optional workspace metadata or a generic unknown-workspace label.

#### Scenario: Shared workspace account ids preserve separate emails
- **GIVEN** two account credentials have different real email addresses
- **AND** both credentials report the same upstream ChatGPT account id
- **WHEN** the operator imports or adds both accounts through OAuth
- **THEN** the system persists separate local account slots for each email
- **AND** the second account does not overwrite the first account's stored email or tokens

#### Scenario: Workspace context uses ChatGPT account id
- **GIVEN** an account has a ChatGPT account id
- **WHEN** the dashboard renders the account workspace context
- **THEN** it displays the ChatGPT account id
- **AND** it does not display the generic unknown-workspace label

### Requirement: Credential login reuses an unambiguous existing account
The dashboard credential-login action SHALL replace credentials on the one matching local account when the imported email and available upstream identity/workspace data identify that row, including a legacy row whose workspace metadata is absent.

#### Scenario: Reauthenticate a single existing account
- **GIVEN** one account for the credential email is persisted with `reauth_required`
- **WHEN** credential login returns converted auth JSON for that email
- **THEN** the response refers to the existing account ID
- **AND** encrypted token fields are replaced and the account becomes active
- **AND** account settings and request history remain attached to that ID
- **AND** no second row is created

#### Scenario: Ambiguous same-email identities are protected
- **GIVEN** multiple account rows share the credential email
- **WHEN** credential login lacks enough workspace/identity metadata to select one row
- **THEN** the line returns an import failure
- **AND** no existing row is changed
- **AND** no duplicate row is created

### Requirement: Credential login captures trustworthy subscription dates

Successful credential login SHALL attempt one bounded read of account entitlement using its existing session and access token, without an additional login, refresh, payment action, or retry. The read SHALL NOT follow redirects. Its failure SHALL NOT fail credential import or expose the upstream payload.

#### Scenario: Login receives a direct expiry
- **WHEN** the matched active Plus entitlement includes a valid expiry and billing date
- **THEN** the imported account exposes that direct expiry through the existing dashboard account response

#### Scenario: Metadata is unavailable or belongs to another account
- **WHEN** reading entitlement fails or the payload cannot establish a matching active Plus/Pro subscription
- **THEN** credential login still imports normally and no expiry is captured

### Requirement: Subscription dates match the authenticated account

Only an active Plus/Pro entitlement matching the authenticated upstream account ID SHALL supply a date. Conflicting identities or matching entitlements SHALL be treated as unknown. A valid direct entitlement `expires_at` SHALL take precedence. A present invalid expiry SHALL NOT trigger a payment fallback.

#### Scenario: Default workspace has no identity
- **WHEN** the payload contains only a default entitlement with no account identity
- **THEN** no subscription date is captured

### Requirement: Original billing dates provide a thirty-day fallback

When expiry is absent or null, an original `payment_date`, `last_payment_at`, `current_period_start`, or `billing_period_start` SHALL supply expiry by adding 30 days. Conflicting billing dates SHALL be treated as unknown. Token expiry, quota resets, and reverse-derived payment dates SHALL NOT supply subscription expiry.

#### Scenario: Login receives only an original billing date
- **WHEN** a matched active Pro entitlement has no expiry and contains an unambiguous payment date
- **THEN** its expiry is computed as the payment instant plus 30 days

### Requirement: Subscription timestamps preserve their instant

Date-only billing values SHALL be interpreted at midnight Asia/Ho_Chi_Minh. Timestamps with offsets SHALL preserve their instant in UTC. Naive datetime timestamps and invalid dates SHALL be rejected.

#### Scenario: Payment date has no time component
- **WHEN** the original billing date is 2030-01-31
- **THEN** the 30-day expiry is 2030-03-01T17:00:00Z

### Requirement: Captured dates preserve existing account metadata

New account imports SHALL save the captured expiry. Reauthorization SHALL fill an empty expiry atomically with credential replacement and SHALL preserve any populated expiry, account identity, history, and routing settings. Missing metadata SHALL NOT clear a stored expiry.

#### Scenario: Existing account has an operator date
- **WHEN** reauthorization obtains a different subscription expiry
- **THEN** tokens are replaced in the same account and its populated expiry and routing configuration are preserved

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
