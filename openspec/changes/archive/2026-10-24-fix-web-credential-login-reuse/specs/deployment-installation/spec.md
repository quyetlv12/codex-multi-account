## ADDED Requirements

### Requirement: Web application is the maintained local product surface
The repository SHALL maintain the server and dashboard web application launch paths. It SHALL not ship standalone macOS desktop build scripts or desktop bundles.

#### Scenario: Maintain the web distribution
- **WHEN** the application distribution is prepared
- **THEN** the server and dashboard web application remain available
- **AND** standalone macOS desktop build scripts and generated bundles are absent
- **AND** the existing macOS web launcher and its icons remain available
