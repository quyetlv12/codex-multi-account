## Requirements

### Requirement: Account card badges share a compact header row

The Accounts card header MUST render the stored plan badge and account status badge in the same right-aligned row.

#### Scenario: Plus account is active

- **WHEN** an Accounts card has plan type `plus` and status `active`
- **THEN** the card MUST show the `Plus` badge and the active status icon in the same badge group
- **AND** the active status badge MUST NOT render the visible `Active` text

### Requirement: Icon-only status remains accessible

The icon-only status badge MUST expose the localized status label through an accessible name and a native tooltip, while retaining the existing status color treatment.

### Requirement: Other status surfaces are unchanged

Status badges outside Accounts card view MUST keep their existing labeled presentation and behavior.
