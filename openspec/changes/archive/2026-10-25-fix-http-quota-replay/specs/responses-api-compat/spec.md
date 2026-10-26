## ADDED Requirements

### Requirement: Direct HTTP quota recovery uses verified portable history

Before visible output, direct HTTP streaming MAY retry on another account after quota failure only when scoped retained history proves the full resend and its projection passes strict account-neutral validation. The exhausted owner MUST stay excluded. File and turn-state ownership, unknown hosted state, compaction, incomplete history, and already-visible output MUST block this recovery.

#### Scenario: Verified unanchored history switches after quota exhaustion

- **GIVEN** a full resend matches the exact stored session prefix and retains prior assistant output and new user input
- **AND** known reasoning bookkeeping is the only nonportable content
- **WHEN** the dispatch owner returns a pre-visible quota failure
- **THEN** the proxy retries a strictly validated projected body on another eligible account
- **AND** the failed owner stays excluded

#### Scenario: Unverified history remains on its owner

- **GIVEN** a full resend has no matching scoped history proof or contains account-scoped files or encrypted compaction
- **WHEN** its owner fails
- **THEN** no cross-account replay occurs
