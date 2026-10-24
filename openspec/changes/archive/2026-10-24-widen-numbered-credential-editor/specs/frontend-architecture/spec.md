## ADDED Requirements

### Requirement: Numbered credential editor
The auto-login modal SHALL use a wider desktop layout with viewport margins. Its editor SHALL keep each account record on one visual line with local horizontal scrolling for long records. It SHALL display sequential record numbers beside nonempty, non-comment lines, synchronized with vertical scrolling. Numbering SHALL NOT alter submitted credentials or partial-failure retry behavior.

#### Scenario: Operator pastes multiple records
- **WHEN** the operator pastes account records separated by newlines, including blank lines or comments
- **THEN** account records have sequential numbers and do not visually wrap
- **AND** blank lines and comments do not consume record numbers
- **AND** the submitted text remains unchanged

#### Scenario: Operator scrolls a long list on a narrow screen
- **WHEN** the editor contains records wider or taller than its viewport
- **THEN** scrolling remains within the editor and the modal fits the viewport
- **AND** numbers remain aligned with the corresponding records
