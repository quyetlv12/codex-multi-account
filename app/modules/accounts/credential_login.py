from __future__ import annotations

import asyncio
import contextlib
import json
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from textwrap import dedent


class CredentialImportError(ValueError):
    pass


@dataclass(frozen=True)
class CredentialLine:
    email: str
    raw: str = field(repr=False)


def parse_credential_lines(text: str, *, max_lines: int = 20) -> list[CredentialLine]:
    lines = [line.strip() for line in text.splitlines() if line.strip() and not line.strip().startswith("#")]
    if not lines:
        raise CredentialImportError("Nhập ít nhất một dòng email|mật khẩu|2FA")
    if len(lines) > max_lines:
        raise CredentialImportError(f"Chỉ hỗ trợ tối đa {max_lines} tài khoản mỗi lần")
    result = []
    for line in lines:
        parts = line.split("|")
        if len(parts) != 3 or not all(part.strip() for part in parts):
            raise CredentialImportError("Mỗi dòng phải có dạng email|mật khẩu|mã 2FA")
        email = parts[0].strip().lower()
        if "@" not in email or email.startswith("@") or email.endswith("@"):
            raise CredentialImportError("Email không hợp lệ")
        result.append(CredentialLine(email, line))
    return result


def _helper() -> tuple[str, str] | None:
    configured = os.environ.get("CODEX_LB_GPT_TOOL_ROOT", "").strip()
    roots = [Path(configured)] if configured else []
    roots.append(Path.home() / "Documents/tool-mmo/chatgpt-tool/modules/gpt-tool")
    for root in roots:
        if (root / "gpt_tool/export.py").is_file():
            configured_python = os.environ.get("CODEX_LB_GPT_TOOL_PYTHON", "").strip()
            if configured_python and Path(configured_python).is_file():
                return configured_python, str(root)
            candidate = root.parent.parent / ".venv/bin/python"
            return (str(candidate) if candidate.is_file() else sys.executable), str(root)
    return None


async def export_credentials(lines: list[CredentialLine], *, timeout_seconds: float = 900.0) -> list[dict]:
    if not lines or len(lines) > 20:
        raise CredentialImportError("Danh sách tài khoản không hợp lệ")
    helper = _helper()
    if helper is None:
        raise CredentialImportError("Không tìm thấy GPT Tool")
    python, root = helper
    script = dedent(
        """
        import json, sys
        from app.modules.accounts.subscription import read_subscription_expiry
        from gpt_tool.convert import canonical_from_oauth, convert_canonical
        from gpt_tool.login import LoginError, login_keep_session
        from gpt_tool.oauth import OAuthError, account_id_from_access, oauth_codex_rt_exchange
        from gpt_tool.parser import parse_line

        out = []
        for index, raw in enumerate(sys.stdin.read().splitlines()):
            try:
                creds = parse_line(raw)
                bundle, session = login_keep_session(creds)
                try:
                    tokens = oauth_codex_rt_exchange(session, bundle.device_id, creds)
                    access = tokens.access_token or ""
                    if not access:
                        raise OAuthError("missing access token")
                    try:
                        subscription_expires_at = read_subscription_expiry(
                            session, access, account_id_from_access(access)
                        )
                    except Exception:
                        # Entitlement is optional metadata; OAuth import must
                        # still succeed when the read or account-id decode fails.
                        subscription_expires_at = None
                finally:
                    close = getattr(session, "close", None)
                    if close is not None:
                        close()
                refresh = tokens.refresh_token or ""
                if not access or not refresh:
                    raise OAuthError("missing token")
                canonical = canonical_from_oauth(
                    email=creds.email,
                    access_token=access,
                    refresh_token=refresh,
                    id_token=tokens.id_token,
                    account_id=account_id_from_access(access),
                    session_token=bundle.session_token,
                )
                out.append({"ok": True, "step": "done", "index": index,
                            "subscription_expires_at": subscription_expires_at,
                            "auth": convert_canonical(canonical, "codex")})
            except LoginError:
                out.append({"ok": False, "step": "login", "index": index})
            except OAuthError:
                out.append({"ok": False, "step": "oauth", "index": index})
            except Exception:
                out.append({"ok": False, "step": "parse", "index": index})
        print(json.dumps(out, ensure_ascii=False))
        """
    )
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    app_root = str(Path(__file__).resolve().parents[3])
    env["PYTHONPATH"] = os.pathsep.join(filter(None, (app_root, env.get("PYTHONPATH"))))
    try:
        proc = await asyncio.create_subprocess_exec(
            python,
            "-c",
            script,
            cwd=root,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
        )
    except OSError as exc:
        raise CredentialImportError("Không thể khởi động GPT Tool") from exc
    try:
        stdout, _ = await asyncio.wait_for(
            proc.communicate("\n".join(line.raw for line in lines).encode()),
            timeout_seconds,
        )
    except asyncio.TimeoutError:
        proc.kill()
        with contextlib.suppress(ProcessLookupError):
            await proc.wait()
        raise CredentialImportError("Đăng nhập hết thời gian chờ") from None
    except asyncio.CancelledError:
        proc.kill()
        with contextlib.suppress(ProcessLookupError):
            await proc.wait()
        raise
    if proc.returncode != 0:
        raise CredentialImportError("GPT Tool không thể hoàn tất đăng nhập")
    try:
        result = json.loads(stdout.decode())
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise CredentialImportError("GPT Tool trả về dữ liệu không hợp lệ") from exc
    valid_steps = {"done", "login", "oauth", "parse"}
    if (
        not isinstance(result, list)
        or len(result) != len(lines)
        or {item.get("index") for item in result if isinstance(item, dict)} != set(range(len(lines)))
        or any(
            not isinstance(item, dict)
            or not isinstance(item.get("index"), int)
            or isinstance(item.get("index"), bool)
            or not isinstance(item.get("ok"), bool)
            or item.get("step") not in valid_steps
            or (item.get("ok") and not isinstance(item.get("auth"), dict))
            or (
                item.get("subscription_expires_at") is not None
                and not isinstance(item.get("subscription_expires_at"), str)
            )
            for item in result
        )
    ):
        raise CredentialImportError("GPT Tool trả về dữ liệu không hợp lệ")
    return result
