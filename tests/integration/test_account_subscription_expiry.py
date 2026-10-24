from __future__ import annotations

import base64
import json
from datetime import UTC, datetime, timedelta

import pytest

from app.core.auth import generate_unique_account_id
from app.core.crypto import TokenEncryptor
from app.core.utils.time import utcnow
from app.db.models import Account, AccountStatus
from app.db.session import SessionLocal
from app.modules.accounts.repository import AccountsRepository
from app.modules.accounts.service import AccountsService

pytestmark = pytest.mark.integration


def _encode_jwt(payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":")).encode()
    body = base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")
    return f"header.{body}.sig"


def _account() -> Account:
    encryptor = TokenEncryptor()
    return Account(
        id="subscription-expiry-account",
        email="subscription-expiry@example.com",
        plan_type="plus",
        access_token_encrypted=encryptor.encrypt("access"),
        refresh_token_encrypted=encryptor.encrypt("refresh"),
        id_token_encrypted=encryptor.encrypt("id"),
        last_refresh=utcnow(),
        status=AccountStatus.ACTIVE,
        deactivation_reason=None,
    )


@pytest.mark.asyncio
async def test_subscription_expiry_set_update_clear_and_omitted_update_preserves_value(db_setup) -> None:
    del db_setup
    first_expiry = datetime.now(UTC) + timedelta(days=3)
    second_expiry = first_expiry + timedelta(days=2)

    async with SessionLocal() as session:
        repo = AccountsRepository(session)
        await repo.upsert(_account())
        service = AccountsService(repo)

        assert await service.update_account("subscription-expiry-account", subscription_expires_at=first_expiry)
        stored = await session.get(Account, "subscription-expiry-account")
        assert stored is not None
        assert stored.subscription_expires_at == first_expiry.replace(tzinfo=None)

        # An omitted field must not erase an operator-managed value.
        assert await service.update_account("subscription-expiry-account") is False
        await session.refresh(stored)
        assert stored.subscription_expires_at == first_expiry.replace(tzinfo=None)

        assert await service.update_account("subscription-expiry-account", subscription_expires_at=second_expiry)
        await session.refresh(stored)
        assert stored.subscription_expires_at == second_expiry.replace(tzinfo=None)

        assert await service.update_account("subscription-expiry-account", subscription_expires_at=None)
        await session.refresh(stored)
        assert stored.subscription_expires_at is None


@pytest.mark.asyncio
async def test_account_api_can_save_update_and_clear_subscription_expiry(async_client) -> None:
    source_account_id = "subscription-expiry-api"
    email = "subscription-expiry-api@example.com"
    auth_json = {
        "tokens": {
            "idToken": _encode_jwt(
                {
                    "email": email,
                    "https://api.openai.com/auth": {"chatgpt_plan_type": "plus"},
                    "chatgpt_account_id": source_account_id,
                },
            ),
            "accessToken": "access-token-not-a-real-secret",
            "refreshToken": "refresh",
            "accountId": source_account_id,
        },
    }
    imported = await async_client.post(
        "/api/accounts/import",
        files={"auth_json": ("auth.json", json.dumps(auth_json), "application/json")},
    )
    assert imported.status_code == 200, imported.text
    account_id = generate_unique_account_id(source_account_id, email)

    saved = await async_client.patch(
        f"/api/accounts/{account_id}",
        json={"subscription_expires_at": "2026-10-27T23:59:59Z"},
    )
    assert saved.status_code == 200, saved.text
    listed = await async_client.get("/api/accounts")
    account = next(row for row in listed.json()["accounts"] if row["accountId"] == account_id)
    assert account["subscriptionExpiresAt"].startswith("2026-10-27")

    updated = await async_client.patch(
        f"/api/accounts/{account_id}",
        json={"subscription_expires_at": "2026-10-29T23:59:59Z"},
    )
    assert updated.status_code == 200, updated.text
    cleared = await async_client.patch(f"/api/accounts/{account_id}", json={"subscription_expires_at": None})
    assert cleared.status_code == 200, cleared.text
    listed = await async_client.get("/api/accounts")
    account = next(row for row in listed.json()["accounts"] if row["accountId"] == account_id)
    assert account["subscriptionExpiresAt"] is None
