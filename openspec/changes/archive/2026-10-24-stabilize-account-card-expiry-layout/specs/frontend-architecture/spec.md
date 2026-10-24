## ADDED Requirements

### Requirement: Missing primary quota preserves expiry layout

The Accounts card view MUST reserve the same vertical space as the primary 5h quota row when an account has another rendered quota window but no reliable primary quota data. The reserved space MUST remain visually empty and MUST NOT invent quota values or reset timestamps.

#### Scenario: Weekly-only account

- **WHEN** an account has a weekly quota window and no primary 5h quota window
- **THEN** the card reserves the primary quota row height before the weekly row
- **AND** the card shows the subscription expiry section at the same content offset as a card with both 5h and weekly rows
- **AND** no synthetic 5h percentage, reset time, or subscription expiry value is exposed to the user

#### Scenario: Existing primary quota

- **WHEN** an account has primary quota data
- **THEN** the card renders the existing primary quota row and does not add an extra placeholder row

### Requirement: Routing and data semantics remain unchanged

The layout placeholder MUST be presentational only. It MUST NOT alter account eligibility, quota calculations, reset ordering, subscription expiry values, routing decisions, or account actions.

#### Scenario: Missing quota remains unknown

- **WHEN** the card reserves space for an unavailable primary quota window
- **THEN** the underlying primary quota and reset timestamp remain unchanged
- **AND** the placeholder is excluded from the accessibility tree
