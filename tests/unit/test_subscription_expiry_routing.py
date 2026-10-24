from datetime import datetime, timezone

from app.core.balancer.logic import AccountState, select_account
from app.db.models import AccountStatus

NOW = datetime(2026, 10, 24, 12, tzinfo=timezone.utc).timestamp()


def state(account_id: str, *, plan: str = "plus", expires: float | None = None, status=AccountStatus.ACTIVE):
    return AccountState(
        account_id=account_id,
        status=status,
        plan_type=plan,
        subscription_expires_at=expires,
        used_percent=0,
        secondary_used_percent=0,
    )


def test_disabled_keeps_existing_strategy_winner():
    accounts = [state("free", plan="free", expires=NOW + 3600), state("plus", expires=NOW + 2 * 86400)]
    result = select_account(
        accounts,
        now=NOW,
        routing_strategy="round_robin",
    )
    disabled_explicit = select_account(
        accounts,
        now=NOW,
        prefer_subscription_expiry=False,
        routing_strategy="round_robin",
    )
    assert result.account is not None
    assert disabled_explicit.account is not None
    assert result.account.account_id == disabled_explicit.account.account_id


def test_nearest_plus_expiry_wins_within_window():
    result = select_account(
        [
            state("later", expires=NOW + 5 * 86400),
            state("nearest", expires=NOW + 2 * 86400),
            state("free", plan="free", expires=NOW + 3600),
        ],
        now=NOW,
        prefer_subscription_expiry=True,
        subscription_expiry_window_days=7,
        routing_strategy="round_robin",
    )
    assert result.account is not None
    assert result.account.account_id == "nearest"


def test_missing_expired_and_outside_window_are_ignored():
    accounts = [state("missing"), state("expired", expires=NOW - 1), state("far", expires=NOW + 8 * 86400)]
    enabled = select_account(
        accounts,
        now=NOW,
        prefer_subscription_expiry=True,
        subscription_expiry_window_days=7,
        routing_strategy="round_robin",
    )
    disabled = select_account(accounts, now=NOW, routing_strategy="round_robin")
    assert enabled.account is not None and disabled.account is not None
    assert enabled.account.account_id == disabled.account.account_id


def test_pro_plan_and_sequential_drain_are_supported():
    result = select_account(
        [
            state("later", plan="plus", expires=NOW + 5 * 86400),
            state("pro_nearest", plan="PRO", expires=NOW + 1 * 86400),
        ],
        now=NOW,
        prefer_subscription_expiry=True,
        routing_strategy="sequential_drain",
    )
    assert result.account is not None
    assert result.account.account_id == "pro_nearest"


def test_ineligible_account_does_not_bypass_quota_or_status():
    result = select_account(
        [
            state("limited", expires=NOW + 86400, status=AccountStatus.QUOTA_EXCEEDED),
            state("active", expires=NOW + 6 * 86400),
        ],
        now=NOW,
        prefer_subscription_expiry=True,
        subscription_expiry_window_days=7,
        routing_strategy="round_robin",
    )
    assert result.account is not None
    assert result.account.account_id == "active"


def test_single_account_and_explicit_affinity_are_not_reordered():
    result = select_account(
        [state("b", expires=NOW + 1 * 86400), state("a", expires=NOW + 5 * 86400)],
        now=NOW,
        prefer_subscription_expiry=True,
        routing_strategy="single_account",
    )
    assert result.account is not None
    assert result.account.account_id == "a"
