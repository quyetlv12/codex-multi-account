"""Explicit, dry-run-first maintenance; never refresh tokens or log account details."""

from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
import tempfile
from collections.abc import Callable
from pathlib import Path

from cryptography.fernet import Fernet

from app.modules.accounts.subscription import read_subscription_expiry, subscription_timestamp


def backfill(
    database: Path,
    key: Path,
    backups: Path,
    reader: Callable[[str, str], str | None],
    *,
    apply: bool = False,
) -> dict[str, int]:
    cipher = Fernet(key.read_bytes())
    with sqlite3.connect(database.resolve().as_uri() + "?mode=ro", uri=True) as source:
        # The maintenance reader currently uses a direct connection only.
        routing = source.execute("SELECT upstream_proxy_routing_enabled FROM dashboard_settings").fetchone()
        if routing is None or routing[0]:
            raise RuntimeError("Direct entitlement maintenance requires proxy routing disabled")
        candidates = source.execute(
            "SELECT id, chatgpt_account_id, access_token_encrypted, plan_type, status FROM accounts "
            "WHERE subscription_expires_at IS NULL AND status='active' "
            "AND lower(plan_type) IN ('plus','pro') AND chatgpt_account_id IS NOT NULL"
        ).fetchall()
    updates = []
    for record in candidates:
        try:
            value = reader(cipher.decrypt(record[2]).decode(), record[1])
            expiry = subscription_timestamp(value)
        except Exception:
            expiry = None
        if expiry is not None:
            updates.append((expiry.isoformat(sep=" ", timespec="microseconds"), *record))
    result = {"eligible": len(candidates), "available": len(updates), "updated": 0}
    if not apply or not updates:
        return result
    backups.mkdir(mode=0o700, parents=True, exist_ok=True)
    folder = Path(tempfile.mkdtemp(prefix="subscription-backfill-", dir=backups))
    # Protect artifacts before writing any sensitive bytes, independent of the caller's umask.
    for name in ("store.db", "encryption.key", "rollback.json", "ROLLBACK.md"):
        (folder / name).touch(mode=0o600)
    shutil.copyfile(key, folder / "encryption.key")
    with sqlite3.connect(database.resolve().as_uri() + "?mode=rw", uri=True, timeout=10) as target:
        with sqlite3.connect(folder / "store.db") as backup:
            target.backup(backup)
        target.execute("BEGIN IMMEDIATE")
        journal = []
        for expiry, local_id, upstream_id, encrypted, plan, status in updates:
            count = target.execute(
                "UPDATE accounts SET subscription_expires_at=? WHERE id=? AND chatgpt_account_id=? "
                "AND access_token_encrypted=? AND plan_type=? AND status=? AND subscription_expires_at IS NULL",
                (expiry, local_id, upstream_id, encrypted, plan, status),
            ).rowcount
            if count:
                journal.append({"id": local_id, "subscription_expires_at": expiry})
        (folder / "rollback.json").write_text(json.dumps(journal), encoding="utf-8")
        (folder / "ROLLBACK.md").write_text(
            "Stop this maintenance command. Do not restore the whole database over newer changes.\n"
            "Review rollback.json against current accounts, then in one transaction clear only dates "
            "whose id AND exact subscription_expires_at still match the journal. "
            "Skip any account edited since backfill, including an intentional edit to the same date.\n"
            "store.db and encryption.key are private pre-write recovery copies. "
            "Restore the full database only for verified corruption during a stopped service window.\n",
            encoding="utf-8",
        )
        target.commit()
        result["updated"] = len(journal)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, required=True)
    parser.add_argument("--key", type=Path, required=True)
    parser.add_argument("--backups", type=Path, required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    # Prefer the same browser-compatible client used by GPT Tool. The bundled
    # codex-lb runtime may not include it, so retain a standard-client fallback
    # for environments where upstream access does not require impersonation.
    try:
        from curl_cffi.requests import Session
    except ModuleNotFoundError:
        from requests import Session
        session_options = {}
    else:
        session_options = {"impersonate": "chrome"}

    with Session(**session_options) as session:
        result = backfill(
            args.database, args.key, args.backups,
            lambda token, identity: read_subscription_expiry(session, token, identity),
            apply=args.apply,
        )
    print(json.dumps(result))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Tracebacks may contain upstream responses, identifiers or credentials.
        print("Subscription maintenance failed; no sensitive details logged.")
        raise SystemExit(1) from None
