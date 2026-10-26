## Implementation
- [x] Specify stable idle scheduling and safety invariants.
- [x] Replace upstream-anchored idle phases with local UTC cycles and catch-up.
- [x] Verify sliding deadlines, restart catch-up, dedupe, spacing and eligibility.
- [x] Run focused regression suites, lint, typing and strict change validation.
- [x] Review diff and document deployment and rollback evidence (verification.md).

## Live follow-up
- [ ] Observe a post-deployment idle warm-up at its scheduled slot; do not force inference or restart the service to obtain this evidence.
