# Quota handoff optimization

Quota is distinct from OAuth token expiry: refreshing credentials does not replenish usage limits. This change reuses existing eligibility and bounded retry logic; no routing policy, API, database schema, settings or dashboard changes.

The bridge already retained verified full client history, but quota recovery accepted only proxy anchors. The quota-only installer now accepts either origin after checking output, replay budget and account ownership. A proven portable payload drops its hard continuity anchor before entering the existing retry path. The generic account-switch helper remains unchanged.

A durable operation ID stays owner-bound because the current retry path has no dedicated operation rebind lifecycle. Those operations, incomplete history and account-bound files retain the existing terminal path. Already-visible output cannot be safely replayed across accounts. A shared bridge socket with any other pending request also stays fail-closed so reconnecting one request cannot interrupt another stream. This does not promise uninterrupted failover for every conversation.

Tests exercise the production event handler and retry method with synthetic reconnect/send boundaries, including failure before and after replacement selection. They do not prove live provider readiness or network continuity. Service activation is deferred to avoid interrupting active Codex requests.
