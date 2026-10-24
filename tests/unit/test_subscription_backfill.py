import json
import sqlite3
import stat

import pytest
from cryptography.fernet import Fernet

from scripts.backfill_subscription_expiry import backfill


@pytest.fixture
def store(tmp_path):
    database, key, backups = (tmp_path / name for name in ("store.db", "encryption.key", "backups"))
    key.write_bytes(Fernet.generate_key())
    cipher = Fernet(key.read_bytes())
    with sqlite3.connect(database) as db:
        db.execute("CREATE TABLE dashboard_settings (upstream_proxy_routing_enabled INTEGER, strategy TEXT)")
        db.execute("INSERT INTO dashboard_settings VALUES (0, 'capacity_weighted')")
        db.execute(
            "CREATE TABLE accounts (id TEXT PRIMARY KEY, chatgpt_account_id TEXT, access_token_encrypted BLOB, "
            "plan_type TEXT, status TEXT, subscription_expires_at TEXT, history TEXT)"
        )
        for index, plan, status, expiry in (
            (1, "plus", "active", None), (2, "pro", "active", None),
            (3, "plus", "active", "2035-01-01"), (4, "free", "active", None),
            (5, "plus", "reauth_required", None),
        ):
            db.execute("INSERT INTO accounts VALUES (?,?,?,?,?,?,?)", (
                str(index), f"upstream-{index}", cipher.encrypt(b"synthetic-token"), plan, status, expiry, "preserved",
            ))
    return database, key, backups


def rows(database):
    with sqlite3.connect(database) as db:
        return db.execute("SELECT * FROM accounts ORDER BY id").fetchall()


def test_apply_backs_up_and_updates_only_empty_eligible_dates(store, capsys):
    database, key, backups = store
    before = rows(database)
    result = backfill(*store, lambda token, identity: "2030-02-01T00:00:00Z", apply=True)
    assert result == {"eligible": 2, "available": 2, "updated": 2}
    after = rows(database)
    for old, new in zip(before[:2], after[:2], strict=True):
        assert old[:5] == new[:5] and old[6:] == new[6:]
        assert new[5] == "2030-02-01 00:00:00.000000"
    assert before[2:] == after[2:]
    folder = next(backups.iterdir())
    assert rows(folder / "store.db") == before
    assert (folder / "encryption.key").read_bytes() == key.read_bytes()
    assert len(json.loads((folder / "rollback.json").read_text())) == 2
    assert stat.S_IMODE(folder.stat().st_mode) == 0o700
    assert all(stat.S_IMODE(path.stat().st_mode) == 0o600 for path in folder.iterdir())
    with sqlite3.connect(database) as db:
        assert db.execute("SELECT * FROM dashboard_settings").fetchone() == (0, "capacity_weighted")
    assert backfill(*store, lambda *args: pytest.fail("Must not fetch populated dates"), apply=True)["updated"] == 0
    assert not capsys.readouterr().out


def test_dry_run_and_upstream_failure_never_write(store):
    before = rows(store[0])
    assert backfill(*store, lambda *args: "2030-02-01T00:00:00Z")["available"] == 2
    def failed(*args):
        raise TimeoutError("synthetic-secret")
    assert backfill(*store, failed, apply=True)["updated"] == 0
    assert rows(store[0]) == before
    assert not store[2].exists()


@pytest.mark.parametrize("change", ["manual-date", "credentials", "identity", "plan", "status", "deleted"])
def test_concurrent_changes_are_preserved(store, change):
    database = store[0]
    def reader(token, identity):
        if identity == "upstream-1":
            with sqlite3.connect(database) as db:
                if change == "deleted":
                    db.execute("DELETE FROM accounts WHERE id='1'")
                else:
                    column, value = {
                        "manual-date": ("subscription_expires_at", "2035-01-01"),
                        "credentials": ("access_token_encrypted", b"new-encrypted-token"),
                        "identity": ("chatgpt_account_id", "changed-account"),
                        "plan": ("plan_type", "free"), "status": ("status", "reauth_required"),
                    }[change]
                    db.execute(f"UPDATE accounts SET {column}=? WHERE id='1'", (value,))
        return "2030-02-01T00:00:00Z"
    result = backfill(*store, reader, apply=True)
    assert result["updated"] == 1
    with sqlite3.connect(database) as db:
        first = db.execute("SELECT subscription_expires_at FROM accounts WHERE id='1'").fetchone()
    assert first == (("2035-01-01",) if change == "manual-date" else None if change == "deleted" else (None,))


def test_backup_failure_prevents_all_writes(store):
    before = rows(store[0])
    store[2].write_text("occupied")
    with pytest.raises(FileExistsError):
        backfill(*store, lambda *args: "2030-02-01T00:00:00Z", apply=True)
    assert rows(store[0]) == before


def test_proxy_routing_refuses_direct_fetch(store):
    with sqlite3.connect(store[0]) as db:
        db.execute("UPDATE dashboard_settings SET upstream_proxy_routing_enabled=1")
    with pytest.raises(RuntimeError):
        backfill(*store, lambda *args: pytest.fail("Must not bypass proxy"), apply=True)
