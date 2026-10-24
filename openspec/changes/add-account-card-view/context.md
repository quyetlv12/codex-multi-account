# Verification

The explicit View details button reuses account selection and opens the account detail modal. Action buttons use equal-width grid cells and a shared height; container width controls the switch from two to three columns. Existing permission checks and callbacks remain unchanged. The Accounts route now opts out of the shared 1500px content cap so the card grid can use the full available viewport width; other routes retain that cap.

Verified with bundled Node: account-list and accounts-page Vitest suites, 25 tests passed. Frontend typecheck, lint, production build and git diff --check passed. The synthetic browser suite passed 10 cases across light/dark themes and 1920px, 1536px, 1535px, 1440px and 390px viewports, including full-width Accounts assertions, computed grid track counts, card overflow checks, route-cap preservation on Settings, and navigation from View details to the selected account detail screen. No account mutations or live service restart were performed.

Card grid responsiveness uses Tailwind's viewport breakpoints: one column below `md`, two from `md`, three from `xl` (1280px), and four from `2xl` (1536px). This maps the requested larger-than-16-inch presentation to a stable browser viewport threshold without guessing physical screen size.

OpenSpec CLI was unavailable on PATH, so strict OpenSpec validation was not run. The change remains unarchived.
