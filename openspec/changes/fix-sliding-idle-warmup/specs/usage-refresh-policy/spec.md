## ADDED Requirements

### Requirement: Idle pre-start scheduling survives sliding upstream deadlines

Idle warm-up MUST use deterministic account slots in UTC epoch-aligned cycles
of the observed primary window duration (300 minutes if absent). Its cycle and
durable `primary_idle` attempt key MUST be independent of upstream reset times.
Upstream quota metadata MUST remain unchanged.

#### Scenario: Sliding relative reset cannot starve later account slots
- **GIVEN** several opted-in active accounts report fresh idle primary samples
- **AND** each sample advances its reset deadline to observation time plus five hours
- **WHEN** each account's deterministic UTC slot is reached
- **THEN** each eligible account can produce one idle attempt
- **AND** moving upstream deadlines do not create new attempt keys in that cycle

### Requirement: Idle pre-start catches up without repeated sends

A fresh eligible idle sample observed at or after its slot MUST remain due until
the scheduling cycle ends. Idle attempts MUST be separated by at least the
greater of the configured cooldown and the observed window duration, including
across scheduler restarts and cycle boundaries.

#### Scenario: Restart catches up a missed slot
- **GIVEN** an idle account has no recent attempt and its UTC slot has passed
- **WHEN** a restarted scheduler records a fresh eligible sample in that cycle
- **THEN** it attempts the idle pre-start once without waiting for another cycle

#### Scenario: Cycle boundary does not duplicate an idle pre-start
- **GIVEN** an idle attempt occurred late in the previous UTC cycle
- **WHEN** a new cycle's account slot arrives before one observed window duration has elapsed
- **THEN** no idle attempt is sent until the minimum spacing has elapsed

### Requirement: Idle catch-up preserves warm-up safety gates

The global and account opt-ins, active status, idle threshold, fresh sample,
unexpired upstream reset deadline, model eligibility and durable claim MUST
continue to gate idle sends. Reset-confirmed warm-up MUST retain its existing
evidence and deduplication rules.

#### Scenario: Expired or stale evidence cannot pre-start
- **WHEN** the latest primary evidence predates the current refresh or its upstream reset is elapsed
- **THEN** no idle pre-start is attempted
