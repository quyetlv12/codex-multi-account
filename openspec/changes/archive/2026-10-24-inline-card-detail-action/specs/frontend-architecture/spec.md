## ADDED Requirements

### Requirement: Inline icon-only card details action
Account cards SHALL place the View details control inside the lower account action grid instead of a standalone row above account settings. The control SHALL display only an eye icon and SHALL retain a localized accessible name and tooltip. Pointer and keyboard activation SHALL open the existing account detail modal and closing it SHALL restore focus to the control. Other action behavior and the list/detail layouts SHALL remain unchanged.

#### Scenario: Open and close details from a card
- **WHEN** the operator activates the eye button by pointer or keyboard
- **THEN** the existing account detail modal opens
- **AND** closing the modal returns focus to the eye button in the action grid

#### Scenario: Responsive action layout
- **WHEN** cards render in light or dark themes on desktop or mobile
- **THEN** the eye button fits within the same grid as other account actions without visible text or horizontal overflow

## MODIFIED Requirements

### Requirement: Readable account action labels
Account action buttons with text SHALL display labels at 14px with bold weight. Labels SHALL fit within their buttons on desktop and mobile in light and dark themes. The card View details control SHALL use an accessible eye icon without visible text. Existing actions, disabled states and visual variants SHALL remain unchanged.

#### Scenario: Scan account actions
- **WHEN** the operator views account actions on a desktop or mobile screen
- **THEN** text labels appear at 14px with weight 700 without clipping or overlap
- **AND** existing actions and disabled states remain available as before
