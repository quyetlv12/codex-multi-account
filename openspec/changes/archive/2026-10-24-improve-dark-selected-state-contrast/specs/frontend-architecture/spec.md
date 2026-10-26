## ADDED Requirements

### Requirement: Distinct dark theme selections
Selected weekday buttons, navigation items and segmented options SHALL use a visibly distinct blue fill with readable text in dark mode, including on hover. Selected labels SHALL maintain a contrast ratio of at least 4.5:1. Existing light-theme styles, selection behavior, disabled states and keyboard focus indicators SHALL be preserved.

#### Scenario: Toggle scheduled weekdays
- **WHEN** the operator selects or deselects a weekday in the automation dialog in dark mode
- **THEN** its visible background and text update with its pressed state
- **AND** selected and unselected backgrounds have a contrast ratio of at least 3:1
- **AND** hovering a selected day preserves its selected appearance

#### Scenario: Identify active navigation and settings
- **WHEN** the operator navigates between screens or selects an appearance option in dark mode
- **THEN** the active item is visually distinct on desktop and mobile without horizontal overflow
- **AND** keyboard focus remains visible
