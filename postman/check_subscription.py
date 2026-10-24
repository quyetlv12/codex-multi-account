"""Exercise the production reader and GPT Tool curl client against a local simulation only."""

import sys
from urllib.parse import urlsplit

from gpt_tool.http_client import build_client

from app.modules.accounts.subscription import read_subscription_expiry


def main() -> None:
    base = sys.argv[1].rstrip("/")
    parsed = urlsplit(base)
    if parsed.scheme != "http" or parsed.hostname != "127.0.0.1":
        raise ValueError("Only a local simulation is supported")
    cases = {"direct": "2030-02-28T00:00:00Z", "payment": "2030-03-01T17:00:00Z", "unavailable": None, "redirect": None}
    with build_client() as session:
        for fixture, expected in cases.items():

            class LocalTransport:
                def get(self, url, **kwargs):
                    assert url == "https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27"
                    kwargs["headers"]["x-fixture-case"] = fixture
                    return session.get(base + urlsplit(url).path, **kwargs)

            result = read_subscription_expiry(LocalTransport(), "synthetic-token", "synthetic-account")
            assert result == expected, fixture
            print(f"PASS {fixture}")


if __name__ == "__main__":
    main()
