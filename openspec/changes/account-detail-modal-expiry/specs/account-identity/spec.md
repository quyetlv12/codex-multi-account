## ADDED Requirements

### Requirement: Card details open in a modal
The Accounts dashboard SHALL open the selected card's existing detail controls in an accessible modal without changing card view. List view SHALL retain its inline detail panel. Modal content SHALL scroll within the viewport on small screens.

#### Scenario: Inspect and return to cards
- **WHEN** an operator selects View details on an account card
- **THEN** a named modal shows that account's details and existing permitted actions
- **AND** closing it with Close or Escape restores focus to the invoking control and retains card view

### Requirement: Plan expiry summary is explicit
Account cards and details SHALL show remaining plan days prominently alongside the full configured timestamp. Remaining days SHALL use ceiling of positive remaining 24-hour periods, with a distinct label below 24 hours. Elapsed dates SHALL show expired. Missing dates SHALL show unknown and MUST NOT derive expiry from quota reset or token expiry. The summary SHALL honor date/time display preferences and fit light/dark mobile layouts. Presentation MUST NOT change routing or eligibility.

#### Scenario: Known expiry
- **GIVEN** a plan expires exactly 30 days from now
- **WHEN** the card or detail is displayed
- **THEN** it shows 30 days and the configured expiry timestamp

#### Scenario: Missing plan date
- **GIVEN** an account has quota reset data but no plan expiry
- **WHEN** the summary is displayed
- **THEN** it shows no plan expiry date and no invented countdown
