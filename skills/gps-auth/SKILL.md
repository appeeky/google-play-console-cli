---
name: gps-auth
description: >-
  Set up Google Play service-account credentials for gps and gps-mcp. Use when
  authenticating, fixing 401/403 errors, choosing credential env vars, or enabling
  read-only mode.
---

# Google Play authentication (`gps`)

## Setup checklist

1. Create a Google Cloud service account.
2. Enable **Google Play Android Developer API**.
3. Invite the SA email in Play Console → **Users and permissions** with the needed app roles.
4. Download the JSON key. Never commit it.

## Credential precedence

1. `--credentials <path|json>`
2. `GPS_CREDENTIALS` / `GOOGLE_PLAY_CREDENTIALS`
3. `GOOGLE_APPLICATION_CREDENTIALS`
4. `~/.config/gps/config.json` → `{ "credentialsPath": "..." }`

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/secure/path/sa.json
gps whoami
```

## Safety flags

| Flag | Use when |
|------|----------|
| `--confirm` | Any write (`deploy`, `reply`, `refund`, `gps call` write ops) |
| `--read-only` | Inspect-only CLI or MCP sessions |

```bash
gps --read-only --package com.example.app tracks list
gps-mcp --read-only --credentials /secure/path/sa.json
```

## Common failures

| Symptom | Likely cause |
|---------|----------------|
| No credentials found | Env/path not set |
| 401 / Login Required | Bad key, wrong library auth, or SA not usable |
| 403 | SA not invited in Play Console or missing permission |
| Empty reviews | API window only returns recent reply-eligible reviews |

Always verify with `gps whoami` before write operations.
