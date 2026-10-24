# macOS launcher icon

The navy tile reuses the dashboard's terminal mark. AppKit renders each native size separately; no additional dependency is needed.

Regenerate on macOS:

```sh
swift scripts/macos/render_launcher_icon.swift /tmp/codex-lb-icon
```

The distributable assets are `packaging/macos/CodexLB.png` and `packaging/macos/CodexLB.icns`. A launcher installer should copy `CodexLB.icns` into `Contents/Resources`, set `CFBundleIconFile` to `CodexLB.icns`, and omit the stock `CFBundleIconName=applet`. The stock asset catalog otherwise takes precedence over the replacement ICNS. Preserve bundle identifier, executable, script and other resources, then renew and verify the bundle's ad-hoc signature.

For an existing installation, back up the whole app first. Rollback restores the complete backed-up bundle with `ditto` and touches the bundle. This does not require restarting codex-lb.

## Local verification on 2026-10-24

- Renderer self-checks passed for 10 representations covering 16 through 1024 pixels; independent review round-tripped the ICNS.
- Finder visibly displays the installed navy icon in the user's Applications folder.
- `codesign --verify --deep --strict --verbose=2` passed.
- The executable matches the backup after removing signatures from temporary copies; `main.scpt` and `applet.rsrc` hashes match exactly. Only the two icon-related Info.plist keys changed.
- Backup and rollback instructions: `~/.codex-lb/backups/launcher-icon-20261024-082743/`.
- No service restart, account refresh, inference, database or routing changes were needed. Launch behavior was verified by payload comparison; the launcher was not executed.
- The icon change passed strict OpenSpec validation before archive; all 57 main specs passed normal validation. Repository-wide strict validation reports existing placeholder-purpose and long-requirement warnings across 55 specs. `git diff --check` passed.
