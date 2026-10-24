# Credential account login

Add an authenticated dashboard action that accepts bounded `email|password|2FA` lines, runs the existing tool-mmo login/OAuth flow on explicit operator action, and imports returned Codex auth JSON through the existing encrypted account persistence.

The existing auth.json upload and routing behavior remain unchanged. Subscription expiry is never inferred from login tokens.

The bridge uses the local `tool-mmo/chatgpt-tool` checkout through the
`CODEX_LB_GPT_TOOL_ROOT` and `CODEX_LB_GPT_TOOL_PYTHON` overrides, with the
known local path as fallback. Credentials stay on subprocess stdin and only
the converted auth payload enters the existing encrypted importer; bulk export
files and extra token refreshes are not used.
