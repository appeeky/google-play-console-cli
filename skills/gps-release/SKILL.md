---
name: gps-release
description: >-
  End-to-end Google Play release with gps: deploy AAB/APK, promote tracks, staged
  rollout, and halt. Use when shipping a build, expanding production percentage,
  or stopping a rollout.
---

# Play release flow

1. Confirm package name and artifact (`.aab` preferred).
2. Deploy to a testing track first:

```bash
gps --package $PKG deploy --file $AAB --track internal --release-notes "$NOTES" --confirm
```

3. Promote when ready:

```bash
gps --package $PKG tracks promote --from internal --to beta --confirm
gps --package $PKG tracks promote --from beta --to production --user-fraction 0.1 --confirm
```

4. Expand or halt:

```bash
gps --package $PKG tracks list --json
gps --package $PKG tracks rollout production --user-fraction 0.5 --confirm
gps --package $PKG tracks halt production --confirm
```

## Rules

- Never skip `--confirm` on writes.
- Prefer internal/alpha before production.
- Use `--validate-only` when dry-running supported commands.
- MCP: `gps_deploy_app`, `gps_promote_release`, `gps_update_rollout`, `gps_halt_release`.
