# Design

- Persist `subscription_expires_at` as a nullable timezone-aware timestamp on `accounts`; legacy rows remain NULL.
- Persist `prefer_subscription_expiry_accounts` (false) and `subscription_expiry_window_days` (7) on dashboard settings through one Alembic revision.
- Account PATCH uses an explicit nullable ISO datetime field so omitted means unchanged and null clears the operator value. Dashboard account detail provides date/time editing and clearing.
- Routing adds the expiry preference only after canonical availability, quota, model compatibility, health, routing-policy, explicit single-account and continuation-affinity constraints. Within a qualifying Plus/Pro pool it keeps the nearest future expiry; ties run the existing selector. Missing, past, or out-of-window dates do not qualify.
- No upstream/auth/usage path writes the value.
