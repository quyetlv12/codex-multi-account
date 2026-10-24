from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Protocol
from zoneinfo import ZoneInfo

_ENTITLEMENT_PATH = "/backend-api/accounts/check/v4-2023-04-27"
_BILLING_KEYS = ("payment_date", "last_payment_at", "current_period_start", "billing_period_start")


class _Response(Protocol):
    status_code: int

    def json(self) -> object: ...


class _Session(Protocol):
    def get(self, url: str, *, headers: dict[str, str], timeout: float, allow_redirects: bool) -> _Response: ...


def subscription_timestamp(value: object) -> datetime | None:
    """Normalize entitlement dates only; never infer a timezone for naive timestamps."""
    if not isinstance(value, str) or len(value) > 64:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if len(value) == 10:
            parsed = parsed.replace(tzinfo=ZoneInfo("Asia/Ho_Chi_Minh"))
        if parsed.tzinfo is None:
            return None
        return parsed.astimezone(timezone.utc).replace(tzinfo=None)
    except (ValueError, OverflowError):
        return None


def subscription_expiry(payload: object, account_id: str) -> datetime | None:
    if not account_id or not isinstance(payload, dict):
        return None
    accounts = payload.get("accounts")
    if not isinstance(accounts, dict):
        return None
    matches = []
    for key, record in accounts.items():
        if not isinstance(record, dict):
            continue
        account = record.get("account")
        identity = account.get("account_id") if isinstance(account, dict) else None
        if key == account_id or identity == account_id:
            if identity is not None and identity != account_id:
                return None
            matches.append(record.get("entitlement"))
    if not matches:
        # A default account without an explicit identity cannot be safely
        # associated with the OAuth account: workspaces may expose different
        # entitlements.  Fail closed instead of guessing.
        return None
    if any(ent != matches[0] for ent in matches):
        return None
    entitlement = matches[0]
    if not isinstance(entitlement, dict) or entitlement.get("has_active_subscription") is not True:
        return None
    plan = entitlement.get("subscription_plan")
    if not isinstance(plan, str) or plan not in {"chatgptplusplan", "chatgptproplan"}:
        return None
    if entitlement.get("expires_at") is not None:
        return subscription_timestamp(entitlement["expires_at"])
    payment_values = [entitlement[key] for key in _BILLING_KEYS if entitlement.get(key) is not None]
    if payment_values:
        payments = [subscription_timestamp(value) for value in payment_values]
        if any(payment is None for payment in payments) or any(payment != payments[0] for payment in payments):
            return None
        try:
            # The operator requested a fixed 30-day term, not calendar-month
            # inference or a date derived backwards from an expiry timestamp.
            return payments[0] + timedelta(days=30) if payments[0] is not None else None
        except OverflowError:
            return None

    return None


def read_subscription_expiry(session: _Session, access_token: str, account_id: str) -> str | None:
    """Best-effort read during explicit login; return only the date, never the billing payload."""
    if not access_token or not account_id:
        return None
    try:
        response = session.get(
            f"https://chatgpt.com{_ENTITLEMENT_PATH}",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
                "Origin": "https://chatgpt.com",
                "Referer": "https://chatgpt.com/",
                "x-openai-target-path": _ENTITLEMENT_PATH,
                "x-openai-target-route": _ENTITLEMENT_PATH,
                "OAI-Language": "en-IN",
            },
            timeout=20.0,
            allow_redirects=False,
        )
        if response.status_code != 200:
            return None
        expiry = subscription_expiry(response.json(), account_id)
        return expiry.isoformat() + "Z" if expiry is not None else None
    except Exception:
        # Entitlement availability must not break OAuth import or leak response/token details.
        return None
