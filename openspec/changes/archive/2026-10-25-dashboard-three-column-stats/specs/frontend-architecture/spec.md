## ADDED Requirements

### Requirement: Overview statistics use three desktop columns
The Dashboard overview statistics SHALL render three equal columns at viewport widths of at least 1024px, two columns from 640px through 1023px, and one column below 640px. Six statistics SHALL form two complete rows on desktop. Existing card content and styling SHALL be preserved.

#### Scenario: Six overview cards on desktop
- **WHEN** the overview displays six statistics at a viewport width of at least 1024px
- **THEN** each row contains three equal-width cards
- **AND** the grid contains two rows

#### Scenario: Small screens
- **WHEN** the overview viewport is narrower than 1024px
- **THEN** the grid uses two columns at widths of at least 640px and one column below 640px
