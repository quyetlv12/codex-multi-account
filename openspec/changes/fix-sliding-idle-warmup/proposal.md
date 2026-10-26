# Fix idle warm-up starvation on sliding upstream deadlines

## Why
An unused primary quota can report a full relative window at every observation.
Scheduling against `reset_at - duration` then keeps its phase near zero forever,
so most opted-in accounts never pre-start. A narrow slot also loses attempts
after a restart or a delayed refresh.

## What Changes
- Use deterministic UTC scheduling cycles of the observed short-window duration
  for idle pre-starts, independently of upstream reset metadata.
- Catch up overdue slots on a fresh eligible observation before the cycle ends.
- Deduplicate idle attempts by local cycle and impose at least one short-window
  duration between idle sends, including across UTC cycle boundaries.
- Preserve upstream quota timestamps and reset-confirmed warm-up behavior.

## Impact
- Limit warm-up service and scheduler call site, with regression tests.
- No schema migration, setting change, token refresh, or routing change.
