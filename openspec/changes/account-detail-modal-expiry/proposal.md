# Account detail modal and readable plan expiry

## Why
Viewing account details currently leaves card view. Plan expiry shows a timestamp without a clear remaining duration.

## What changes
- Open existing account details in an accessible, scrollable modal from cards; preserve list details.
- Share a calendar summary showing remaining days and the full configured expiry timestamp on cards and details.
- Preserve all existing actions, editing permissions, routing settings, and data.

## Impact
Frontend account presentation only; no API, schema, migration, or live service changes.
