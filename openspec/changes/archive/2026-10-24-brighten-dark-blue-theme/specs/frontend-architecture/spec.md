## ADDED Requirements

### Requirement: Brighter dark blue dashboard theme
The dark theme SHALL use slightly brighter blue tinted surfaces and readable muted text while preserving existing layout, light theme values, and semantic status colors.

#### Scenario: Dark theme remains readable
- **WHEN** the dashboard is rendered with the dark theme
- **THEN** the page, cards, controls, borders, and muted labels use the brighter blue palette without horizontal overflow or loss of contrast

#### Scenario: Light theme is unchanged
- **WHEN** the dashboard is rendered with the light theme
- **THEN** its existing palette and behavior remain unchanged
