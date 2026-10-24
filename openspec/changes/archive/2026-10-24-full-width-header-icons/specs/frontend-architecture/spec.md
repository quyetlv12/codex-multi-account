## ADDED Requirements

### Requirement: Full-width header with navigation icons

The application header SHALL span the available viewport width with horizontal
padding and no centered maximum-width cap. Every core and advanced navigation
destination SHALL display a decorative Lucide icon alongside its translated
label on desktop and in the compact menu. Icons SHALL be hidden from assistive
technology so the existing accessible names remain unchanged.

#### Scenario: Wide desktop navigation

- **WHEN** the viewport is at least 1280 CSS pixels wide
- **THEN** the header brand and action controls align with the header's outer padding
- **AND** the desktop menu displays icons and labels without overlap or overflow
- **AND** existing routes, active states, reset-credit badges and Advanced grouping remain available

#### Scenario: Compact navigation

- **WHEN** the viewport is narrower than 1280 CSS pixels
- **THEN** the header exposes a compact menu button instead of the desktop menu
- **AND** opening it displays the same destinations with icons and translated labels
- **AND** selecting a destination navigates and closes the menu
