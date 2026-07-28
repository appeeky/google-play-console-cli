---
name: gps-troubleshooting
description: >-
  Diagnose gps and gps-mcp failures: missing credentials, 401/403, empty reviews,
  read-only blocks, and package/permission issues. Use when Google Play commands fail
  or return unexpected empty results.
---

# Troubleshooting `gps`

## 1. Auth first

```bash
gps whoami
```

| Error | Fix |
|-------|-----|
| No credentials found | Set `GOOGLE_APPLICATION_CREDENTIALS` or `--credentials` |
| 401 | Regenerate SA key; confirm API enabled |
| 403 | Invite SA in Play Console with app access |

## 2. Wrong package

Use the exact application id (`com.example.app`). Listings/tracks succeeding for one package and failing for another usually means permissions are app-scoped.

## 3. Empty reviews

`reviews list` → `{ "reviews": [] }` is often normal: Publisher API only returns a recent slice of reply-eligible reviews. Verify auth with `tracks list` / `listings list`.

## 4. Read-only surprises

`--read-only` / MCP `--read-only` blocks writes (`deploy`, `reply`, `refund`, …). Track/listing **reads** still work (ephemeral edit, never committed).

| Message | Meaning |
|---------|---------|
| Cannot perform write operation … in read-only mode | Drop `--read-only` or use a write-enabled session after user approval |

## 5. Writes without confirm

CLI write commands fail without `--confirm`. Add it only after the user clearly asked for the mutation.

## 6. Discovery

```bash
gps ops <keyword>
gps search <keyword>
```

If a subcommand is missing, use `gps call` / MCP with the registry name.
