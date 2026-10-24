# Design

- Keep entitlement lookup inside the existing credential-login subprocess and reuse the authenticated session/access token once.
- Persist the normalized expiry only for a new row or an existing row with no stored expiry; preserve operator-entered metadata during reauthorization.
- Include `subscription_expires_at` in the credential-login account response so the web client can render the result immediately, while the normal account list remains the source of truth after invalidation.
- Ship the source package only after focused backend/frontend checks and a reversible data backup. Do not refresh existing accounts in the background or call inference.
