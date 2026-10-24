# Login subscription simulation

Local-only synthetic stand-in for the entitlement endpoint consumed by credential login.
The payload fields come from tool-mmo `modules/twofa/session_phase.py`'s
`_parse_entitlement_plan` and `modules/browser-login/test_workspace_verification.py`'s
account identity fixture. This is an internal web endpoint, not a public API contract.
No owner-published mock was used; these fixtures do not prove the current upstream response.
No real credentials or accounts are needed.

Start with Postman CLI >=1.70:

```sh
postman simulation run postman/simulations/login-subscription.sim.yaml --port 2499 --no-history --output ndjson
```

In another terminal, run with the GPT Tool Python environment and both source roots
on `PYTHONPATH` (codex-lb root and `tool-mmo/chatgpt-tool/modules/gpt-tool`):

```sh
python postman/check_subscription.py http://127.0.0.1:2499/entitlement
```

The runner uses GPT Tool's real curl client and the production entitlement reader.
Its test-only transport changes the destination to loopback. It checks direct expiry,
30-day payment fallback, HTTP 503 and redirect handling. Check the simulation log for
four requests and no `/must-not-follow` request. Stop the simulation with Ctrl+C.
