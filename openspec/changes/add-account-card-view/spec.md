## Requirements

- The Accounts dashboard MUST use card view as the default and MUST provide an accessible control to switch between list and card views.
- Card view MUST reuse the existing account filtering, sorting, privacy masking, eligibility and action permission rules.
- Each card MUST render account status, available quota windows and reset labels, and MUST label subscription expiry separately from quota reset data.
- Selecting an account card MUST preserve access to the existing account detail editing flow.
- Card view MUST be presentational only and MUST NOT change routing or account data.
- Each card MUST expose an explicit View details button that opens the existing account detail flow for that account.
- Account action buttons MUST have equal widths and heights within a responsive grid, with all existing callbacks and permission rules preserved.
- Card view MUST render one column on narrow mobile viewports, two columns from the medium breakpoint, three columns from 1280px, and four columns from the 1536px viewport breakpoint.
- The four-column breakpoint MUST be based on viewport width rather than physical display size, because browsers do not expose a reliable physical-inch measurement.
- The Accounts route content container MUST use the full available viewport width while preserving the existing horizontal padding and responsive card breakpoints.
- Other routes MUST retain the existing 1500px content max-width.
