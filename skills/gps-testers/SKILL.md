---
name: gps-testers
description: >-
  Manage Google Play track testers (email lists / Google Groups) with gps. Use when
  adding closed testing users, updating internal/alpha/beta testers, or reading tester config.
---

# Track testers

```bash
gps --package $PKG testers get internal
gps --package $PKG testers get alpha
gps --package $PKG --json testers get beta
```

Update emails (comma-separated or as supported by the CLI flags):

```bash
gps --package $PKG testers update internal \
  --emails qa@company.com,dev@company.com \
  --confirm
```

MCP / ops: `gps_get_testers`, `gps_update_testers`.

Notes:

- Tester changes apply to a **track**, not the whole account.
- Confirm the track name (`internal`, `alpha`, `beta`, or custom) before writing.
- Combining with internal sharing: see `gps-internal-sharing` skill for artifact distribution without a full track release.
