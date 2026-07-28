---
name: gps-listings
description: >-
  Read and update Google Play store listings and listing images with gps or MCP.
  Use when changing title, short/full description, screenshots, icon, or feature graphic.
---

# Store listings

## Text

```bash
gps --package $PKG --json listings list
gps --package $PKG listings get en-US
gps --package $PKG listings update en-US \
  --title "App Name" \
  --short-description "Short pitch (max 80 chars)" \
  --full-description "Full description..." \
  --confirm
```

Validate lengths before writing. Prefer one locale at a time unless the user asked for bulk updates.

## Images (ops / MCP)

```bash
gps call gps_list_images '{
  "packageName":"'"$PKG"'",
  "language":"en-US",
  "imageType":"phoneScreenshots"
}'
```

Common `imageType` values: `icon`, `featureGraphic`, `phoneScreenshots`, `sevenInchScreenshots`, `tenInchScreenshots`, `tvBanner`, `tvScreenshots`, `wearScreenshots`.

Upload / delete:

- `gps_upload_image`
- `gps_delete_image`
- `gps_delete_all_images`

Writes need `--confirm` on CLI. MCP tools: `gps_list_listings`, `gps_update_listing`, `gps_list_images`, …
