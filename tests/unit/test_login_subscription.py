from copy import deepcopy
from datetime import datetime
from types import SimpleNamespace

import pytest

from app.modules.accounts.subscription import read_subscription_expiry, subscription_expiry, subscription_timestamp


def entitlement(**fields):
    return {
        "accounts": {
            "default": {
                "account": {"account_id": "synthetic-account"},
                "entitlement": {
                    "subscription_plan": "chatgptplusplan",
                    "has_active_subscription": True,
                    **fields,
                },
            }
        }
    }


def test_direct_expiry_wins_over_payment_and_preserves_instant():
    payload = entitlement(expires_at="2030-02-01T01:30:00+07:00", payment_date="2030-01-01")
    assert subscription_expiry(payload, "synthetic-account") == datetime(2030, 1, 31, 18, 30)


@pytest.mark.parametrize("key", ["payment_date", "last_payment_at", "current_period_start", "billing_period_start"])
def test_original_payment_adds_thirty_days_not_calendar_month(key):
    payload = entitlement(subscription_plan="chatgptproplan", expires_at=None, **{key: "2030-01-31"})
    assert subscription_expiry(payload, "synthetic-account") == datetime(2030, 3, 1, 17)


def test_consistent_billing_instants_are_accepted():
    payload = entitlement(payment_date="2030-01-01T07:00:00+07:00", current_period_start="2030-01-01T00:00:00Z")
    assert subscription_expiry(payload, "synthetic-account") == datetime(2030, 1, 31)


@pytest.mark.parametrize(
    "fields",
    [
        {},
        {"expires_at": "invalid", "payment_date": "2030-01-01"},
        {"expires_at": "2030-01-01T00:00:00"},
        {"payment_date": "invalid"},
        {"payment_date": "2030-01-01", "current_period_start": "2030-01-02"},
        {"payment_date": "9999-12-31T00:00:00Z"},
        {"token_expiry": "2030-01-01", "reset_at": "2030-01-01"},
        {"expires_at": "2030-01-01", "has_active_subscription": False},
        {"expires_at": "2030-01-01", "has_active_subscription": "true"},
        {"expires_at": "2030-01-01", "subscription_plan": "chatgptteamplan"},
        {"expires_at": "2030-01-01", "subscription_plan": []},
    ],
)
def test_untrustworthy_or_unsupported_metadata_does_not_invent_expiry(fields):
    assert subscription_expiry(entitlement(**fields), "synthetic-account") is None


@pytest.mark.parametrize("payload", [None, [], {}, {"accounts": []}, {"accounts": {"default": None}}])
def test_malformed_payload_is_ignored(payload):
    assert subscription_expiry(payload, "synthetic-account") is None


def test_identity_matching_rejects_wrong_missing_or_conflicting_accounts():
    payload = entitlement(expires_at="2030-01-01")
    assert subscription_expiry(payload, "other-account") is None
    del payload["accounts"]["default"]["account"]
    assert subscription_expiry(payload, "synthetic-account") is None
    payload["accounts"]["synthetic-account"] = payload["accounts"].pop("default")
    assert subscription_expiry(payload, "synthetic-account") == datetime(2029, 12, 31, 17)
    payload["accounts"]["synthetic-account"]["account"] = {"account_id": "other-account"}
    assert subscription_expiry(payload, "synthetic-account") is None


def test_duplicate_account_entries_must_agree():
    payload = entitlement(expires_at="2030-01-01")
    payload["accounts"]["synthetic-account"] = deepcopy(payload["accounts"]["default"])
    assert subscription_expiry(payload, "synthetic-account") is not None
    payload["accounts"]["default"]["entitlement"]["expires_at"] = "2030-01-02"
    assert subscription_expiry(payload, "synthetic-account") is None


@pytest.mark.parametrize("value", [None, 123, True, {}, "", "x" * 65, "2030-02-30", "2030-01-01T12:00:00"])
def test_timestamp_rejects_invalid_values(value):
    assert subscription_timestamp(value) is None


@pytest.mark.parametrize("failure", ["timeout", "json", "redirect", "unauthorized", "html"])
def test_entitlement_failure_is_optional_and_never_retries_or_follows_redirects(failure, capsys, caplog):
    calls = []

    def get(url, **kwargs):
        calls.append((url, kwargs))
        if failure == "timeout":
            raise TimeoutError("synthetic-secret")

        def decode():
            raise ValueError("synthetic-secret")

        return SimpleNamespace(
            status_code={"redirect": 302, "unauthorized": 401, "html": 500}.get(failure, 200), json=decode
        )

    assert read_subscription_expiry(SimpleNamespace(get=get), "synthetic-secret", "synthetic-account") is None
    assert len(calls) == 1
    url, kwargs = calls[0]
    assert url == "https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27"
    assert kwargs["timeout"] == 20
    assert kwargs["allow_redirects"] is False
    assert "synthetic-secret" not in caplog.text + capsys.readouterr().out


def test_read_returns_only_normalized_date():
    session = SimpleNamespace(
        get=lambda *a, **kw: SimpleNamespace(
            status_code=200, json=lambda: entitlement(expires_at="2030-02-01T00:00:00Z")
        )
    )
    assert read_subscription_expiry(session, "synthetic-token", "synthetic-account") == "2030-02-01T00:00:00Z"
