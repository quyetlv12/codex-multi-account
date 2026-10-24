## ADDED Requirements

### Requirement: Credential login reuses an unambiguous existing account
The dashboard credential-login action SHALL replace credentials on the one matching local account when the imported email and available upstream identity/workspace data identify that row, including a legacy row whose workspace metadata is absent.

#### Scenario: Reauthenticate a single existing account
- **GIVEN** one account for the credential email is persisted with `reauth_required`
- **WHEN** credential login returns converted auth JSON for that email
- **THEN** the response refers to the existing account ID
- **AND** encrypted token fields are replaced and the account becomes active
- **AND** account settings and request history remain attached to that ID
- **AND** no second row is created

#### Scenario: Ambiguous same-email identities are protected
- **GIVEN** multiple account rows share the credential email
- **WHEN** credential login lacks enough workspace/identity metadata to select one row
- **THEN** the line returns an import failure
- **AND** no existing row is changed
- **AND** no duplicate row is created
