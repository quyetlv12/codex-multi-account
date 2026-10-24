## ADDED Requirements

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
