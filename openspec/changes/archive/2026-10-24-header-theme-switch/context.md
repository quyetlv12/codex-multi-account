# Implementation Brief

Reasoning target: low for the localized UI change; existing desktop packaging is retained.

The header currently opens a three-option theme dropdown. Replace only that control with an icon switch using the existing Button and Zustand theme store. Keep the dashboard's current tokens and restrained motion, including reduced-motion support. The appearance settings retain Light, Dark and System.

Acceptance: clicking or pressing Space/Enter toggles the effective light/dark theme and persists the explicit selection; system preference is displayed as its resolved theme until toggled; settings changes remain reflected; the header fits 320–2560px widths in both themes. Verify focused Vitest cases, TypeScript/build, targeted lint and mocked browser interaction/layout checks. No account, API, routing, database or live service behavior changes.

Verified: 12 focused theme unit tests, three Playwright switch/responsive-header tests, targeted ESLint and production build passed. Read-only review found no actionable switch issues. The rebuilt `dist/macos-desktop-switch` app passed relocation, bundled runtime/helper imports, isolated empty-data startup, native WebView readiness, graceful shutdown, existing-service reuse and unrelated-listener rejection checks. Code signature and ZIP integrity passed. The installed launcher and live service were not replaced; real login and inference were not exercised.
