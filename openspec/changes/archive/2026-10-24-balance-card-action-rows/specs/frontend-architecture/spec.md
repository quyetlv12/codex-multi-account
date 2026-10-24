## ADDED Requirements

### Requirement: Balanced account card action rows
Account cards with room for multiple columns SHALL use two equally sized actions per row. When an odd number of actions would leave one action alone, the final three actions SHALL share a row in three equal columns. Seven actions SHALL form rows of two, two and three; six actions SHALL form three rows of two. Action order, behavior and accessible names SHALL be preserved. Non-card action layouts SHALL remain unchanged.

#### Scenario: Reset credit adds a seventh action
- **WHEN** an account card renders seven action buttons
- **THEN** its last row contains Reset, View details and Delete in three equal columns without a fourth row

#### Scenario: No reset credit
- **WHEN** an account card renders six action buttons
- **THEN** all rows contain two actions without horizontal overflow
