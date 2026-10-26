## ADDED Requirements

### Requirement: Verified client resends recover from bridge owner quota

The HTTP bridge SHALL permit verified account-neutral full resends to leave an exhausted owner before output, for client or proxy anchors. Recovery SHALL exclude that owner and retain bounded retries. Unverified history, account-bound files, ownership or operation pins, prior output and spent retries SHALL remain ineligible. General transport and authentication replay policy SHALL remain unchanged.

#### Scenario: Verified client history survives owner exhaustion

- **GIVEN** an unsent verified portable full resend with a client-provided prior-response anchor
- **WHEN** its owner reports quota exhaustion before any output
- **THEN** recovery submits the full history without the old anchor to another eligible account
- **AND** the downstream request receives no intermediate quota error

#### Scenario: Unsafe recovery preserves ownership

- **GIVEN** missing full-history proof, account-bound content, a replay ownership pin, visible output, or a spent replay budget
- **WHEN** its owner reports quota exhaustion
- **THEN** no cross-account replay occurs and the existing terminal error path is retained

#### Scenario: Replacement failure cannot inherit old owner metadata

- **GIVEN** quota recovery has selected a replacement account
- **WHEN** the replacement retry fails before completion
- **THEN** the bridge retires the replacement session without restoring the exhausted owner's turn-state metadata

#### Scenario: Multiplexed bridge sessions fail closed

- **GIVEN** another request is still pending on the shared bridge socket
- **WHEN** the current owner reports quota exhaustion
- **THEN** the bridge keeps the request queued and does not reconnect or hand off the shared session
