import json
import sys
from textwrap import dedent

import pytest

from app.modules.accounts.credential_login import (
    CredentialImportError,
    CredentialLine,
    export_credentials,
    parse_credential_lines,
)
from app.modules.accounts.schemas import AccountImportResponse
from app.modules.accounts.service import AccountsService


def test_parse_accepts_comments_and_preserves_pipe_credentials_without_repr_secret():
    lines = parse_credential_lines("# comment\nUser@Example.com|p|JBSWY3DPEHPK3PXP\n")
    assert lines[0].email == "user@example.com"
    assert "JBSWY3DPEHPK3PXP" not in repr(lines[0])


@pytest.mark.parametrize(
    "text",
    ["user@example.com|password", "user@example.com||totp", "not-an-email|password|totp"],
)
def test_parse_rejects_malformed_credentials(text):
    with pytest.raises(CredentialImportError):
        parse_credential_lines(text)


@pytest.mark.asyncio
async def test_export_rejects_duplicate_or_out_of_range_helper_indexes(monkeypatch):
    class FakeProcess:
        returncode = 0

        async def communicate(self, _input):
            return json.dumps(
                [
                    {"index": 0, "ok": False, "step": "login"},
                    {"index": 0, "ok": False, "step": "login"},
                ]
            ).encode(), b""

        def kill(self):
            pass

        async def wait(self):
            pass

    async def fake_exec(*_args, **_kwargs):
        return FakeProcess()

    monkeypatch.setattr("app.modules.accounts.credential_login._helper", lambda: ("python", "."))
    monkeypatch.setattr("asyncio.create_subprocess_exec", fake_exec)
    with pytest.raises(CredentialImportError, match="dữ liệu không hợp lệ"):
        await export_credentials(
            [CredentialLine("a@example.com", "a@example.com|p|t"), CredentialLine("b@example.com", "b@example.com|p|t")]
        )


@pytest.mark.asyncio
async def test_service_returns_partial_results_without_exposing_credentials(monkeypatch):
    service = object.__new__(AccountsService)

    async def fake_export(_lines):
        return [
            {"index": 0, "ok": True, "step": "done", "auth": {"safe": "payload"}},
            {"index": 1, "ok": False, "step": "oauth"},
        ]

    monkeypatch.setattr("app.modules.accounts.service.export_credentials", fake_export)

    async def fake_import(_raw, *, replace_existing=False, subscription_expires_at=None):
        assert replace_existing is True
        assert subscription_expires_at is None
        return AccountImportResponse(account_id="id", email="masked@example.com", plan_type="plus", status="active")

    monkeypatch.setattr(service, "import_account", fake_import)
    result = await service.import_credential_lines("a@example.com|secret|totp\nb@example.com|secret|totp")
    assert [item.ok for item in result.results] == [True, False]
    assert "secret" not in result.model_dump_json()


@pytest.mark.parametrize("http_status", [200, 403])
async def test_real_helper_subprocess_imports_subscription_metadata_and_closes_session(
    tmp_path, monkeypatch, http_status
):
    package = tmp_path / "gpt_tool"
    package.mkdir()
    (package / "__init__.py").write_text("")
    (package / "fixture.py").write_text(
        dedent(f"""
        from pathlib import Path
        from types import SimpleNamespace
        class LoginError(Exception): pass
        class OAuthError(Exception): pass
        class Session:
            def get(self, url, *, headers, timeout, allow_redirects):
                assert headers["Authorization"] == "Bearer synthetic-new-access"
                assert url == "https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27"
                assert timeout == 20 and allow_redirects is False
                payload = {{"accounts": {{"default": {{"account": {{"account_id": "synthetic-account"}},
                    "entitlement": {{"has_active_subscription": True, "subscription_plan": "chatgptplusplan",
                    "payment_date": "2030-01-31"}}}}}}}}
                return SimpleNamespace(status_code={http_status}, json=lambda: payload)
            def close(self):
                Path("session-closed").touch()
        def parse_line(raw):
            return SimpleNamespace(email="synthetic@example.com")
        def login_keep_session(creds):
            return SimpleNamespace(device_id="synthetic-device", access_token="synthetic-old-access",
                session_token=""), Session()
        def oauth_codex_rt_exchange(session, device_id, creds):
            return SimpleNamespace(access_token="synthetic-new-access", refresh_token="synthetic-refresh", id_token="")
        def account_id_from_access(access):
            return "synthetic-account"
        def canonical_from_oauth(**kwargs):
            return kwargs
        def convert_canonical(value, kind):
            return {{"tokens": value}}
    """)
    )
    for module in ("convert", "login", "oauth", "parser"):
        (package / f"{module}.py").write_text("from .fixture import *\n")
    monkeypatch.setattr("app.modules.accounts.credential_login._helper", lambda: (sys.executable, str(tmp_path)))
    result = await export_credentials(parse_credential_lines("synthetic@example.com|synthetic-password|synthetic-totp"))
    assert result[0]["ok"] is True
    assert result[0]["subscription_expires_at"] == ("2030-03-01T17:00:00Z" if http_status == 200 else None)
    assert (tmp_path / "session-closed").is_file()
