# Subscription dates captured during credential login

The operator requested expiry as an original payment timestamp plus 30 days when
an upstream expiry is absent. A payment date of 2030-01-31 at midnight in
Asia/Ho_Chi_Minh therefore gives 2030-03-02 at local midnight, rather than a
calendar-month increment. Direct upstream expiry takes precedence.

The integration reuses the logged-in session and new OAuth access token. Only an
active Plus/Pro entitlement matching that token's account identity is eligible.
Default-workspace data without identity is insufficient. Token expiry, quota
resets and payment dates derived backwards from expiry are excluded.

Entitlement is an internal web API and can be unavailable. Failure leaves the
date unknown without failing credential import. Existing populated dates are
preserved because the schema has no manual/automatic provenance. No background
polling or additional authentication is introduced. Local fixtures and Postman
simulation verify behavior without asserting current upstream availability.

## Existing accounts missing a date

An explicit operator command, `python -m scripts.backfill_subscription_expiry`,
accepts `--database`, `--key` and `--backups` paths. It previews counts by default;
`--apply` enables the guarded update. Run it from the checkout with the existing
browser-compatible login dependencies available. Proxy routing must be disabled
because this maintenance reader only supports direct connections. An upstream
access failure leaves the date unknown; it must not trigger authentication.

Private database/key backups and a conditional rollback journal are created
before writing. Rollback must compare each exact written date against the live
record and skip any subsequent edit; restoring the whole database over newer
work is inappropriate. For example, a manual date entered during entitlement
lookup wins over the backfill.

On 2026-10-24 the explicit maintenance run populated eight missing dates from
direct upstream expiry values. Database/API counts were 8/8 afterward, private
backup integrity passed, and the dashboard displayed dates and countdowns.
The service was not restarted. Automatic capture during future credential login
still requires deployment of the separately prepared backend change.
