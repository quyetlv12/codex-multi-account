# Subscription expiry aware account routing

Add an operator-managed, nullable subscription package expiry date to each account and expose it in the dashboard. Add an opt-in dashboard routing preference with a configurable day threshold (default 7) that prioritizes eligible Plus/Pro accounts whose package expires within the threshold. Existing routing remains unchanged when the preference is disabled or no qualifying account exists.

The expiry value is independent from quota reset timestamps and authentication token expiry. It is never inferred from upstream usage or token claims.
