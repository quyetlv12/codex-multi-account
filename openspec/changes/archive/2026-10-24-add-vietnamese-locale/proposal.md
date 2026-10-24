# Vietnamese dashboard locale

## Goal

Provide Vietnamese throughout the existing dashboard through its language selector.

## Scope and acceptance

- Add `vi` to desktop and mobile language selectors using the existing i18next setup.
- Translate every English locale key, preserving placeholders, code, and identifiers.
- Default to Vietnamese on first visit, normalize `vi-VN` as `vi`, persist selection
  using the existing browser preference, and retain existing saved language choices.
- Use Vietnamese date and number formatting while retaining existing compact K/M/B
  and USD conventions.
- Verify key/placeholder completeness, selector interaction, persistence, formatted
  values, build/lint, and representative desktop/mobile screens.

No API, routing, authentication, account data, or database changes are required.
Deploy frontend assets with a private backup and replace the HTML entry last;
the running backend does not need a restart.
