The durable verifier already recognizes exact pending-tool manifests as complete response context. The owner-unavailable gate independently required assistant text and therefore disagreed with that verifier. Use the verifier against the current durable lookup, preserving portable projection checks and account ownership restrictions.

Example: stored user request followed by function_call(call-1) and function_call_output(call-1) may recover only when the durable response records precisely that pending call. A durable manifest containing call-1 and call-2 must reject a resend containing only call-1.

The observed production error used HTTP bridge owner continuity. Logs establish an exhausted owner, but do not identify the rejected payload guard. These regressions demonstrate a concrete recovery gap without claiming to reconstruct the private failed request. Live activation and provider inference remain unverified while the existing connection is preserved.


## Verification and activation (2026-10-25)

- Regression reproduced before the fix for complete function and custom-tool continuations.
- Focused bridge recovery suite: 23 passed, 623 deselected.
- Full bridge and replay-safety suites: 842 passed, 9 failed. All nine failures were reproduced with the original HEAD bridge module, then the patch was restored: eight test settings fixtures lack `prefer_subscription_expiry_accounts`; one fixture lacks the `file_account_pins` table.
- Ruff check/format, ty on both changed Python files, and git diff whitespace checks passed. Independent read-only review found no actionable issues.
- Tests exercise the bridge with synthetic errors and mocked session boundaries. No live provider inference or new Postman bridge simulation was run; the older direct HTTP simulation does not establish bridge behavior.

The installed streaming module was backed up and atomically replaced after compilation and verification that its 29 directly imported application modules matched the checkout. SHA-256: `2a5b06ed0df6bdd30439f3e41a29ebc9c9f6017507c28ce5f8577fdb57789794`.

Backup: `/Users/quyetdev/.codex-lb/backups/bridge-tool-quota-replay-20261025-110019/app/modules/proxy/_service/http_bridge/streaming.py`.

The service was not restarted or reloaded. PID 907, started Sun Oct 25 08:01:38 2026, remained running and health returned HTTP 200 after staging. The running process retains the old imported module; activation is pending its next normal service start. No database/config changes or token refresh were performed.

OpenSpec: the change passes strict validation. Full main-spec strict validation remains blocked by existing repository warnings (54 of 57 specs invalid in strict mode), including preexisting long requirement paragraphs in Responses compatibility. The added requirement itself passes strict delta validation. Main specification was synchronized before archiving.
