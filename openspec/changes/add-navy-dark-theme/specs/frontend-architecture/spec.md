## ADDED Requirements

### Requirement: Navy dark dashboard appearance
The dashboard SHALL render its dark theme with a navy background, distinct blue-gray card and popover surfaces, readable foreground and muted text, and a blue primary accent. Semantic success, warning, and destructive states SHALL remain distinguishable. Light-theme colors and existing account layouts SHALL remain available.

#### Scenario: Dark theme is selected
- **WHEN** the operator selects Dark
- **THEN** cards, menus, dialogs, native form controls, and themed charts render using the dark palette

### Requirement: Header theme preference selector
The dashboard header SHALL expose Light, Dark, and Auto on desktop and mobile through a keyboard-accessible selector with an accessible name and selected-state semantics. It SHALL reuse the appearance settings preference and browser storage.

#### Scenario: Preference persists
- **WHEN** the operator selects Dark and reloads the dashboard
- **THEN** Dark remains selected and applied

#### Scenario: Automatic appearance
- **WHEN** the operator selects Auto
- **THEN** the effective theme follows the operating-system color preference, including subsequent changes
