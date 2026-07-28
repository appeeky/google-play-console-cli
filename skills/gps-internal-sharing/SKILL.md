---
name: gps-internal-sharing
description: >-
  Upload APK/AAB to Google Play internal app sharing with gps. Use when sharing a
  build via internal sharing link without promoting a track release.
---

# Internal app sharing

```bash
gps --package $PKG internal-sharing upload --file ./app-release.aab --confirm
gps --package $PKG internal-sharing upload --file ./app-release.apk --confirm
```

Ops / MCP: `gps_upload_internal_sharing`.

## When to use

- Quick QA build distribution
- Share a build without changing track releases
- Prefer full `deploy` + track promote when you need Console release history / staged rollout

Return the download/share URL from the API response to the user.
