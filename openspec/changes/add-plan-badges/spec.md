## Requirements

### Requirement: Account plans use color-coded badges
The Accounts card and account detail header MUST render the stored plan type as a labeled badge instead of plain text.

#### Scenario: Known Plus plan
- **WHEN** an account has plan type `plus` (case-insensitive)
- **THEN** the badge MUST display `Plus` with the same emerald treatment used by the active status badge

#### Scenario: Other known plans
- **WHEN** an account has another recognized plan type
- **THEN** the badge MUST display its readable plan label with a stable plan-specific color

#### Scenario: Unknown plan
- **WHEN** the stored plan type is not recognized
- **THEN** the badge MUST preserve a readable formatted label and use a neutral fallback color without changing the stored value

### Requirement: Existing account behavior is preserved
The plan badge MUST be presentational only and MUST NOT change account filtering, routing, quota calculations, privacy masking, or action permissions.
