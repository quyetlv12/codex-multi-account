## ADDED Requirements

### Requirement: Vietnamese runtime locale

The dashboard SHALL support `vi` with the label `Tiếng Việt` in desktop and mobile
language selectors. It SHALL translate every English locale key, preserve
interpolation variables and technical identifiers, and format localizable dates
and numbers using `vi-VN`. Existing compact K/M/B and USD display conventions SHALL
remain unchanged.

#### Scenario: Select and retain Vietnamese

- **WHEN** a user selects Tiếng Việt
- **THEN** the dashboard renders Vietnamese text and sets the document language to `vi`
- **AND** reloading retains that choice through `codex-lb-language`
- **AND** no account or routing settings change

#### Scenario: Default to Vietnamese

- **WHEN** the dashboard opens without a stored or explicitly requested language
- **THEN** the dashboard uses the Vietnamese bundle
- **AND** existing stored language choices retain precedence over this default
- **AND** an explicitly requested `vi-VN` locale is normalized to `vi`

#### Scenario: Complete Vietnamese translations

- **WHEN** locale keys and interpolation placeholders are compared with English
- **THEN** every English key and its placeholders are present in Vietnamese
- **AND** account plan expiry is described separately from quota reset and token expiry
