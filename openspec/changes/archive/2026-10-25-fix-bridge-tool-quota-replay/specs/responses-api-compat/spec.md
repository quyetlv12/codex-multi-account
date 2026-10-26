## ADDED Requirements

### Requirement: Bridge tool continuation recovery verifies the durable manifest

On an owner-unavailable failure, HTTP bridge recovery SHALL permit a portable full resend when its stored prefix matches the current durable lookup and its tool calls and outputs exactly match the prior response's pending-tool manifest. The failed owner SHALL remain excluded. Missing, mismatched or incomplete manifests, account-bound files, forwarded requests and nonportable history SHALL NOT gain cross-account replay eligibility.

#### Scenario: Complete tool continuation switches accounts

- **GIVEN** the client resends the verified stored prefix and all function or custom tool calls and outputs from the durable prior response
- **WHEN** the owner is unavailable before dispatch
- **THEN** the bridge uses another eligible account with the complete portable history and no previous response anchor
- **AND** the failed owner remains excluded

#### Scenario: Incomplete tool continuation stays fail-closed

- **GIVEN** tool calls or outputs are missing or differ from the current durable manifest
- **WHEN** the owner is unavailable
- **THEN** no cross-account replay occurs
