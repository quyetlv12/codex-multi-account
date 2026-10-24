## ADDED Requirements

### Requirement: Recognizable local macOS launcher icon

The local macOS Codex LB launcher SHALL use a distinct navy rounded-square icon with the existing terminal mark. The ICNS asset SHALL include standard 16 through 1024 pixel representations. Updating the icon SHALL preserve the launcher identifier, executable and script, and SHALL NOT restart the service or alter account data or routing settings.

#### Scenario: Updating the installed launcher icon

- **GIVEN** an existing local Codex LB launcher with the generic AppleScript icon
- **WHEN** its icon is updated
- **THEN** macOS displays the Codex LB icon
- **AND** the original launcher is backed up for rollback
- **AND** the executable code excluding its renewed signature and the script remain unchanged
