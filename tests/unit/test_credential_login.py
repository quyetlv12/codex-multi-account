import json

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

    async def fake_import(_raw):
        return AccountImportResponse(account_id="id", email="masked@example.com", plan_type="plus", status="active")

    monkeypatch.setattr(service, "import_account", fake_import)
    result = await service.import_credential_lines("a@example.com|secret|totp\nb@example.com|secret|totp")
    assert [item.ok for item in result.results] == [True, False]
    assert "secret" not in result.model_dump_json()
