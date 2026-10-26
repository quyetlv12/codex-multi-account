# Verification and runtime evidence

Checked on 2026-10-24, approximately 20:50 Asia/Ho_Chi_Minh.

## Local verification

- `tests/unit/test_limit_warmup.py` and `tests/integration/test_usage_refresh_scheduler_scope.py`: 75 passed.
- `tests/unit/test_usage_refresh_scheduler_recovery.py`: 28 passed.
- Ruff check of the two application files and two changed test files: passed.
- `ty check app/modules/limit_warmup/service.py app/core/usage/refresh_scheduler.py`: passed.
- `openspec validate fix-sliding-idle-warmup --strict`: passed using the existing cached CLI and bundled Node runtime.
- `git diff --check`: passed before this documentation update.
- Independent read-only review found no blocking issue in cycle keys, catch-up, spacing, eligibility or durable claims.

These results validate the focused change, not every unrelated repository spec or test.

## Existing deployment

The previous chat had already installed both changed application files and restarted the service. This continuation did not restart, drain, reconfigure or replace the running service.

- Installed `app/modules/limit_warmup/service.py` and `app/core/usage/refresh_scheduler.py` exactly matched the tested checkout.
- Installed file modification times preceded the current process start (20:33:18 local time).
- `/health` and `/health/ready` returned HTTP 200.
- Read-only drain status reported `draining=false` and five in-flight requests at the observation time.
- Both warm-up settings remained enabled. Eight accounts remained active and opted in.
- Fresh usage samples were present. One historical idle warm-up succeeded at 20:17, before this deployment; that event does not prove the new scheduler has sent a request.
- The remaining idle short-window account's local slot was approximately 21:22:30 local time, subject to a fresh eligible sample and the next scheduler refresh. No post-deployment idle send was observed during this continuation.

No real inference was triggered for verification. No credentials, account identifiers, routing settings, quota metadata or live database rows were changed.

## Recovery

The existing private backup is `/Users/quyetdev/.codex-lb/backups/fix-sliding-idle-warmup-20261024T133234Z/`, with original and patched sources and `ROLLBACK.md`. Do not expose its private recovery files. Normal code rollback must preserve subsequent live database writes. Any future service restart must be planned separately to respect the user's connection constraint.
