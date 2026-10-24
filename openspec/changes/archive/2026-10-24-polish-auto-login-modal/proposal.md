# Polish the auto-login modal

## Why
The credential modal lacks visual hierarchy, a clear action footer, and visible pending feedback.

## What Changes
- Use a compact navy-compatible header, a format guide, a readable credential input, and aligned actions.
- Make pending, result, and error states accessible and usable on small screens.
- Preserve credential submission, partial-failure retry, and auth.json import behavior.

## Impact
Frontend presentation and translations only; no API, routing, storage, or database changes.
