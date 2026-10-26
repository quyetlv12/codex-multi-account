## Why
Dark outline styles override selected weekday colors, and active navigation and segmented options are difficult to distinguish.

## What Changes
- Use a consistent high-contrast blue fill and dark text for selected dark-theme controls and navigation.
- Preserve light-theme styles, focus indicators, disabled states and selection behavior.
- Verify actual rendered contrast and interactions at desktop and mobile sizes.

## Impact
Frontend styles only; no API, routing, account data or service lifecycle changes.
