## ADDED Requirements

### Requirement: Status-colored account card borders
Account card borders SHALL use the same color family as their normalized status badge: emerald for active, amber for paused, orange for rate limited, red for quota exceeded, sky for reauthentication required and zinc for deactivated. Selected cards SHALL retain a visible selection ring in that status color family. Borders SHALL update when account status changes and remain visible in light and dark themes without changing card layout or account actions.

#### Scenario: Identify account status from a card
- **WHEN** account cards render in light or dark mode on desktop or mobile
- **THEN** each card border matches its status color family
- **AND** its accessible status icon and actions remain available

#### Scenario: Account status changes
- **WHEN** an account receives an updated status
- **THEN** its border and selection ring reflect the new status color family
