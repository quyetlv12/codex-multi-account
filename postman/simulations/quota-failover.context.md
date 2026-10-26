# Direct HTTP quota failover

Synthetic SSE responses reuse the existing `test_proxy_utils.py` envelopes. This is local recovery evidence, not a claim about live provider availability. No credentials, account refreshes or paid inference calls are used.

Start Postman CLI 1.70+ with:

```sh
postman simulation run postman/simulations/quota-failover.sim.yaml --port auto --no-history --output ndjson
```

Use the actual listening port from its output:

```sh
CODEX_LB_TEST_QUOTA_SIMULATION_URL=http://127.0.0.1:PORT/quota .venv/bin/python -m pytest tests/unit/test_proxy_utils.py -k stream_verified_fresh_replay_moves_off_owner_after_previsible_quota -q
```

The override changes only the upstream destination and forces HTTP in the regression harness; production SSE parsing and streaming retry run unchanged. Verify requests appear in the simulation log. Proven history must finish on the replacement; mismatched proof, wrong owner and compaction must make only one request. Visible-output suppression is covered by the deterministic streaming fixture. Stop the simulation with Ctrl+C.
