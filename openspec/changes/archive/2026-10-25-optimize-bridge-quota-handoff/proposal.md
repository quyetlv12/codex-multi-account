## Why
Verified full client resends are unnecessarily rejected by bridge quota recovery because their prior-response anchor was supplied by the client.

## What Changes
Allow verified portable full resends to leave an exhausted owner before any output, using existing retry and account selection mechanisms. Preserve file ownership, replay limits, and existing API/configuration/data.

## Impact
HTTP bridge quota recovery and its regression tests only. No OAuth refresh or service restart.
