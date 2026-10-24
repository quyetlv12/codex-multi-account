# Full-width header with navigation icons

## Goal

Use the available screen width for the application header and make menu items
easier to identify with the installed Lucide icon set.

## Scope and acceptance

- Remove the header content's 1500px cap while retaining its horizontal padding.
- Add decorative Lucide icons alongside translated desktop and mobile menu labels.
- Retain routes, active states, reset-credit badges, Advanced grouping and actions.
- Use the compact menu below 1280px to keep translated labels and controls readable.
- Verify navigation, no header overflow, wide-screen alignment, light/dark themes,
  and compact-menu interaction; run header tests, lint and production build.

No backend or data changes. Deploy static assets with a private backup and
rollback instructions, replacing the HTML entry last without restarting service.
