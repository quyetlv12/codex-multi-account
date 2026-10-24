## ADDED Requirements

### Requirement: Compact accounts page header
The accounts page SHALL omit the visible page title and subtitle above the accounts toolbar, while retaining a visually hidden accessible page heading and the account detail modal's keyboard focus fallback.

#### Scenario: Operator opens the accounts page
- **WHEN** the accounts page is displayed
- **THEN** the toolbar appears without a visible title or subtitle block above it
- **AND** assistive technology can still identify the page heading
