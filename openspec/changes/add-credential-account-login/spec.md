# Credential account login requirements

## Requirements

- The dashboard MUST accept at most 20 non-comment credential lines per request.
- The dashboard MUST require dashboard write access before starting login.
- Login MUST start only after an explicit dashboard action and MUST return a per-line result.
- Passwords, TOTP secrets, access tokens, refresh tokens, and raw upstream errors MUST NOT be returned in the API response or written to temporary export files.
- Successful OAuth results MUST be passed through the existing encrypted account import path.
- The feature MUST NOT derive or overwrite subscription expiry from token expiry or reset quota data.
