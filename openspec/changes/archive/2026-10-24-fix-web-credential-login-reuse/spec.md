# Web credential login account reuse

## Requirements

- The authenticated web credential-login endpoint MUST pass successful converted credentials through an in-place replacement mode that preserves the existing local account ID and account-owned settings/history when exactly one matching account can be identified.
- Matching MUST use the imported email together with available upstream identity/workspace metadata; when workspace metadata is absent, a single unambiguous same-email account MAY be reused, but multiple same-email candidates MUST fail without mutating any account or creating a duplicate.
- A credential-login replacement MUST update encrypted access, refresh, and ID token material and clear `reauth_required` status through the existing replacement path.
- The ordinary `auth.json` import endpoint MUST retain its configured import-without-overwrite behavior.
- Credential-login tests MUST use synthetic payloads and MUST NOT call tool-mmo login, token refresh, inference, or live account services.
- The maintained deployment surface MUST be the web application; standalone macOS desktop build scripts, bundled desktop assets, and active standalone-desktop requirements MUST not remain in the product tree.
