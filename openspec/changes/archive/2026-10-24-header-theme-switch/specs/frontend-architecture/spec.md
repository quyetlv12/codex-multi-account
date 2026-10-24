## ADDED Requirements

### Requirement: Header light and dark theme switch
The dashboard header SHALL expose a compact light/dark switch with sun and moon icons instead of a theme dropdown. Its checked state SHALL represent the effective dark theme and its accessible name SHALL remain stable. Activation SHALL toggle the effective theme and persist an explicit light or dark preference through the existing theme store.

#### Scenario: Toggle and restore dark mode
- **WHEN** the user activates the header switch in light mode
- **THEN** the dashboard changes to dark mode and the switch is checked
- **AND** dark mode is restored when the dashboard reloads

#### Scenario: System preference and appearance settings
- **WHEN** the saved preference is System
- **THEN** the switch reflects the resolved system theme without changing the saved preference
- **AND** activating it selects the opposite explicit theme
- **AND** Light, Dark and System remain selectable in appearance settings

#### Scenario: Keyboard operation
- **WHEN** the user focuses the switch and presses Space or Enter
- **THEN** the effective theme toggles and the switch retains keyboard focus

#### Scenario: Responsive and reduced-motion layout
- **WHEN** the header renders at widths from 320px to 2560px
- **THEN** the switch fits without header overflow
- **AND** its transitions are disabled when reduced motion is requested
