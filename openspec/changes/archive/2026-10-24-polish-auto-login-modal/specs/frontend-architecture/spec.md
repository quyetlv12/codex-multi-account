## ADDED Requirements

### Requirement: Auto-login modal presentation
The auto-login modal SHALL separate its title, credential format guide, labeled input, privacy hint, and action footer. It SHALL use the dashboard theme and fit narrow viewports without horizontal overflow, allowing vertical scrolling on short viewports.

#### Scenario: Operator enters credentials
- **WHEN** the operator opens auto login on a desktop or mobile viewport
- **THEN** a labeled multiline input and the email|password|2FA format guide are visible
- **AND** close and submit actions are distinguishable and keyboard accessible

#### Scenario: Login is pending
- **WHEN** credential login is busy
- **THEN** the input and close/submit controls are disabled and a processing label is displayed
- **AND** dismissing the modal does not clear the pending input

#### Scenario: Retry after a partial failure
- **WHEN** some submitted accounts fail
- **THEN** the modal remains open, shows result counts, and retains only failed lines for retry
- **AND** the result summary does not repeat credential material
