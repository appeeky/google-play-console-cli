---
name: gps-ops
description: >-
  Discover and invoke the full Google Play gps operation registry via gps ops,
  gps call, or MCP gps_* tools. Use when a dedicated CLI subcommand is missing or
  the user asks for an advanced Publisher API action.
---

# Operation registry

Source of truth for CLI ↔ MCP parity.

```bash
gps ops
gps ops monetization
gps search review
gps capabilities --json
```

## Invoke

```bash
gps --package $PKG call gps_list_reviews '{"maxResults":10}'
gps call gps_list_tracks '{"packageName":"com.example.app"}'
```

Write example:

```bash
gps --package $PKG --confirm call gps_reply_to_review '{
  "reviewId":"REVIEW_ID",
  "replyText":"Thanks for the feedback!"
}'
```

## Rules

1. If unsure of the name, `gps ops <keyword>` or MCP `gps_search_capabilities`.
2. JSON args must match the op schema (`packageName`, ids, file paths, …).
3. Global `--package` fills `packageName` when omitted in JSON.
4. Write ops require `--confirm` on CLI.
5. Prefer dedicated subcommands when they exist (`tracks`, `reviews`, `deploy`); use `call` for the rest.
