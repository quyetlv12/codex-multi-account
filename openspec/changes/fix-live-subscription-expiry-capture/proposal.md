# Fix live subscription expiry capture

The dashboard already renders a subscription expiry field, but the installed web service can still run an older credential-login helper that never reads entitlement metadata. Update the packaged login path and response contract so a successful explicit credential login returns and persists a trusted Plus/Pro expiry when upstream provides one.

The change remains best-effort: missing, ambiguous, or invalid upstream entitlement data leaves the expiry unknown and never uses token expiry, quota reset, or an inferred date.
