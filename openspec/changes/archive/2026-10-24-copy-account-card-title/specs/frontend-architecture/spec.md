## ADDED Requirements

### Requirement: Copy account card title
Pointer or keyboard activation of an account card title SHALL copy its full alias, display name, or fallback email, even when truncated or privacy-blurred. Localized feedback SHALL report clipboard success or failure. Title activation SHALL NOT open details or invoke account management actions. The separate View details button SHALL still open the detail modal.

#### Scenario: Copy a title
- **WHEN** the operator activates an account card title
- **THEN** the full title is copied and success feedback is shown
- **AND** the account detail modal remains closed

#### Scenario: Clipboard unavailable
- **WHEN** the clipboard operation fails
- **THEN** failure feedback is shown without reporting success

#### Scenario: Open account details
- **WHEN** the operator activates View details
- **THEN** the account detail modal opens as before
