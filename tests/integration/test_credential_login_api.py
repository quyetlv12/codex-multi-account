from __future__ import annotations

import base64
import json
from datetime import datetime
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select

from app.core.auth import generate_unique_account_id
from app.core.crypto import TokenEncryptor
from app.db.models import Account, AccountStatus, DashboardSettings, RequestLog, UsageHistory
from app.db.session import SessionLocal
from app.modules.usage.updater import UsageUpdater

pytestmark = pytest.mark.integration


def _auth(*, workspace: str | None = None, upstream: str = "synthetic-upstream") -> dict:
    claims = {
        "email": "synthetic@example.com",
        "chatgpt_account_id": upstream,
        "workspace_id": workspace,
        "https://api.openai.com/auth": {"chatgpt_plan_type": "plus"},
    }
    body = base64.urlsafe_b64encode(json.dumps(claims).encode()).rstrip(b"=").decode()
    return {
        "tokens": {
            "idToken": f"header.{body}.sig",
            "accessToken": "synthetic-new-access",
            "refreshToken": "synthetic-new-refresh",
            "accountId": upstream,
        }
    }


@pytest.fixture(autouse=True)
def mock_login(monkeypatch):
    exporter = AsyncMock(return_value=[{"index": 0, "ok": True, "auth": _auth()}])
    monkeypatch.setattr("app.modules.accounts.service.export_credentials", exporter)
    monkeypatch.setattr(UsageUpdater, "refresh_accounts", AsyncMock(return_value=None))
    return exporter


async def _seed(
    *,
    workspace: str | None = None,
    local_id: str = "existing-local",
    expiry: datetime | None = datetime(2030, 1, 2),
) -> None:
    encryptor = TokenEncryptor()
    async with SessionLocal() as session:
        session.add(
            Account(
                id=local_id,
                chatgpt_account_id="synthetic-upstream",
                email="synthetic@example.com",
                workspace_id=workspace,
                alias="Keep alias",
                subscription_expires_at=expiry,
                routing_policy="draining",
                plan_type="plus",
                access_token_encrypted=encryptor.encrypt("synthetic-old-access"),
                refresh_token_encrypted=encryptor.encrypt("synthetic-old-refresh"),
                id_token_encrypted=encryptor.encrypt("synthetic-old-id"),
                last_refresh=datetime(2026, 1, 1),
                status=AccountStatus.REAUTH_REQUIRED,
                deactivation_reason="synthetic expired grant",
            )
        )
        if await session.get(DashboardSettings, 1) is None:
            session.add(DashboardSettings(id=1, import_without_overwrite=True))
        session.add(UsageHistory(account_id=local_id, window="primary", used_percent=42))
        session.add(
            RequestLog(
                account_id=local_id, request_id=f"synthetic-{local_id}", model="synthetic-model", status="success"
            )
        )
        await session.commit()


async def _login(client):
    return await client.post(
        "/api/accounts/credential-login", content="synthetic@example.com|synthetic-password|synthetic-totp"
    )


@pytest.mark.parametrize("workspace", [None, "synthetic-workspace"])
@pytest.mark.parametrize("canonical_id", [False, True])
async def test_auto_login_replaces_existing_tokens_preserving_settings_and_history(
    async_client, workspace, canonical_id
):
    local_id = (
        generate_unique_account_id("synthetic-upstream", "synthetic@example.com") if canonical_id else "existing-local"
    )
    await _seed(workspace=workspace, local_id=local_id)
    for _ in range(2):
        response = await _login(async_client)
        assert response.status_code == 200
        assert response.headers["cache-control"] == "no-store"
        result = response.json()["results"][0]
        assert result["ok"] is True
        assert result["account"]["accountId"] == local_id
        assert "synthetic-new-" not in response.text
        assert "synthetic-password" not in response.text

    async with SessionLocal() as session:
        accounts = list((await session.scalars(select(Account))).all())
        assert len(accounts) == 1
        account = accounts[0]
        assert account.status == AccountStatus.ACTIVE
        assert account.deactivation_reason is None
        assert account.alias == "Keep alias"
        assert account.subscription_expires_at == datetime(2030, 1, 2)
        assert account.routing_policy == "draining"
        assert account.workspace_id == workspace
        encryptor = TokenEncryptor()
        assert encryptor.decrypt(account.access_token_encrypted) == "synthetic-new-access"
        assert encryptor.decrypt(account.refresh_token_encrypted) == "synthetic-new-refresh"
        assert encryptor.decrypt(account.id_token_encrypted) == _auth()["tokens"]["idToken"]
        usage = (await session.scalars(select(UsageHistory))).one()
        assert usage.account_id == local_id
        assert usage.used_percent == 42
        assert (await session.scalars(select(RequestLog))).one().account_id == local_id
        assert (await session.get(DashboardSettings, 1)).import_without_overwrite is True


@pytest.mark.parametrize("canonical_id", [False, True])
async def test_ambiguous_workspace_less_login_does_not_mutate_or_add_accounts(async_client, canonical_id):
    local_id = generate_unique_account_id("synthetic-upstream", "synthetic@example.com") if canonical_id else "slot-a"
    await _seed(workspace="workspace-a", local_id=local_id)
    await _seed(workspace="workspace-b", local_id="slot-b")
    response = await _login(async_client)
    assert response.status_code == 200
    assert response.json()["results"] == [{"index": 0, "ok": False, "step": "import", "account": None}]
    async with SessionLocal() as session:
        accounts = list((await session.scalars(select(Account))).all())
        assert len(accounts) == 2
        assert all(a.status == AccountStatus.REAUTH_REQUIRED for a in accounts)
        assert all(TokenEncryptor().decrypt(a.access_token_encrypted) == "synthetic-old-access" for a in accounts)


async def test_auto_login_creates_account_when_no_match_exists(async_client):
    response = await _login(async_client)
    assert response.status_code == 200
    assert response.json()["results"][0]["ok"] is True
    async with SessionLocal() as session:
        account = (await session.scalars(select(Account))).one()
        assert account.status == AccountStatus.ACTIVE
        assert TokenEncryptor().decrypt(account.access_token_encrypted) == "synthetic-new-access"


async def test_known_workspace_login_only_replaces_matching_slot(async_client, mock_login):
    await _seed(workspace="workspace-a", local_id="slot-a")
    await _seed(workspace="workspace-b", local_id="slot-b")
    mock_login.return_value[0]["auth"] = _auth(workspace="workspace-b")
    response = await _login(async_client)
    assert response.json()["results"][0]["account"]["accountId"] == "slot-b"
    async with SessionLocal() as session:
        assert len(list((await session.scalars(select(Account))).all())) == 2
        assert (await session.get(Account, "slot-a")).status == AccountStatus.REAUTH_REQUIRED
        assert (await session.get(Account, "slot-b")).status == AccountStatus.ACTIVE


async def test_new_identity_is_added_without_overwriting_other_upstream(async_client, mock_login):
    await _seed()
    mock_login.return_value[0]["auth"] = _auth(upstream="different-upstream")
    response = await _login(async_client)
    assert response.json()["results"][0]["ok"] is True
    async with SessionLocal() as session:
        assert len(list((await session.scalars(select(Account))).all())) == 2
        assert (await session.get(Account, "existing-local")).status == AccountStatus.REAUTH_REQUIRED


async def test_failed_login_leaves_existing_account_unchanged(async_client, mock_login):
    await _seed()
    mock_login.return_value = [{"index": 0, "ok": False, "step": "oauth"}]
    response = await _login(async_client)
    assert response.json()["results"][0]["ok"] is False
    async with SessionLocal() as session:
        accounts = list((await session.scalars(select(Account))).all())
        assert len(accounts) == 1
        assert accounts[0].status == AccountStatus.REAUTH_REQUIRED
        assert TokenEncryptor().decrypt(accounts[0].access_token_encrypted) == "synthetic-old-access"


async def test_regular_file_import_still_respects_without_overwrite(async_client):
    await _seed()
    response = await async_client.post(
        "/api/accounts/import", files={"auth_json": ("auth.json", json.dumps(_auth()), "application/json")}
    )
    assert response.status_code == 200
    async with SessionLocal() as session:
        assert len(list((await session.scalars(select(Account))).all())) == 2
        assert (await session.get(Account, "existing-local")).status == AccountStatus.REAUTH_REQUIRED


@pytest.mark.parametrize("existing", [False, True])
async def test_login_saves_captured_expiry_and_dashboard_exposes_it(async_client, mock_login, existing):
    if existing:
        await _seed(expiry=None)
    mock_login.return_value[0]["subscription_expires_at"] = "2030-03-02T17:00:00Z"
    response = await _login(async_client)
    assert response.json()["results"][0]["ok"] is True
    async with SessionLocal() as session:
        accounts = list((await session.scalars(select(Account))).all())
        assert len(accounts) == 1
        assert accounts[0].subscription_expires_at == datetime(2030, 3, 2, 17)
        account_id = accounts[0].id
        if existing:
            assert account_id == "existing-local"
            assert accounts[0].routing_policy == "draining"
            assert (await session.scalars(select(UsageHistory))).one().account_id == account_id
    dashboard = await async_client.get("/api/accounts")
    assert dashboard.status_code == 200
    account = next(item for item in dashboard.json()["accounts"] if item["accountId"] == account_id)
    assert account["subscriptionExpiresAt"] == "2030-03-02T17:00:00Z"
    assert response.json()["results"][0]["account"]["subscriptionExpiresAt"] == "2030-03-02T17:00:00Z"


@pytest.mark.parametrize("captured", [None, "invalid", "2031-01-01T00:00:00Z"])
async def test_login_preserves_populated_expiry_and_routing_settings(async_client, mock_login, captured):
    await _seed()
    async with SessionLocal() as session:
        settings = await session.get(DashboardSettings, 1)
        before = {column.name: getattr(settings, column.name) for column in DashboardSettings.__table__.columns}
    mock_login.return_value[0]["subscription_expires_at"] = captured
    assert (await _login(async_client)).json()["results"][0]["ok"] is True
    async with SessionLocal() as session:
        assert (await session.get(Account, "existing-local")).subscription_expires_at == datetime(2030, 1, 2)
        settings = await session.get(DashboardSettings, 1)
        after = {column.name: getattr(settings, column.name) for column in DashboardSettings.__table__.columns}
        assert before == after
