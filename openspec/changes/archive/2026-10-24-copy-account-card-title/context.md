Implementation uses the existing clipboard helper and localized toast feedback. Only the title is a copy button; badges and metadata are not copy targets. The View details button retains its existing dialog action.

Verified: 16 focused component and clipboard tests; ESLint; TypeScript production build; two theme browser checks locally and two against installed web assets at port 2455, with mocked API data and a real browser clipboard. No login, refresh, inference, or database writes. Static backup: /Users/quyetdev/.codex-lb/backups/web-copy-account-title-20261024-135255.

Validation: this change passes strict OpenSpec validation. Repository-wide strict validation reports pre-existing long-requirement and placeholder-purpose warnings; these unrelated specs were not rewritten.
