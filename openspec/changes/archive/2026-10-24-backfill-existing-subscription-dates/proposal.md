# Fill missing subscription dates for existing accounts

## Why

The running dashboard supports expiry dates but existing accounts have no stored dates.

## What Changes

Provide an explicit local maintenance command reusing the strict entitlement parser and existing access tokens. No refresh, login, inference, migration, routing-setting change, or server restart is required.

Only matching active Plus/Pro accounts with empty expiry qualify. Back up the database and encryption key privately before writing, and condition writes on unchanged credentials, identity, plan, status and empty expiry. Report counts only. Keep a private conditional rollback journal so later unrelated account changes are preserved.
