# Stabilize account card expiry layout

## Why

Keep the subscription expiry section aligned across account cards when an account has a secondary quota window but no primary 5h quota window.

## What Changes

- Accounts card view only.
- Preserve the current quota, expiry, routing, and account data semantics.
- Keep the missing 5h state visually empty while reserving the same layout space as a rendered 5h quota row.
