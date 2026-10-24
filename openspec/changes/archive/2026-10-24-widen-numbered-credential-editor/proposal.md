# Widen and number the credential editor

## Why
Long account credentials wrap in the narrow auto-login modal and records are hard to locate.

## What Changes
- Widen the desktop modal while preserving viewport margins.
- Keep each record on one visual line with local horizontal scrolling.
- Number nonempty, non-comment records in a fixed gutter that follows vertical scrolling.

## Impact
Frontend only; preserve raw submission, retry, import, and busy behavior. No account or storage changes.
