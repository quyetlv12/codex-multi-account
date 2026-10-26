## Why

Direct HTTP streaming can exclude an exhausted dispatch owner while retaining an account-bound history body, so selection fails even when another account has quota. The bridge already projects verified full history into a portable fresh body.

## What Changes

- Reuse verified retained-history projection for direct HTTP retry before visible output.
- Support unanchored full resends only with exact session-scoped history proof and retained prior output.
- Preserve file ownership, strict replay validation, account exclusions, settlement and lease cleanup.

## Impact

- Responses streaming retry and focused regression tests; no configuration or database changes.
- Prepare and validate locally without restarting or modifying the active service.
