---
name: gps-accounts
description: >-
  Configure multiple Google Play service-account keys and a local app registry
  with gps. Use when working with several developer accounts, listing apps, or
  switching --account / package defaults.
---

# Multi-account and apps

## Facts agents must know

1. **One SA key can access many apps** if those apps (or account-level access) were granted in Play Console.
2. **Google Publisher API cannot list apps.** There is no `applications.list`. `gps apps list` reads the **local registry** in `~/.config/gps/config.json`.
3. Pass `--package` (or registered `defaultPackage`) on every Publisher call.

## Setup

```bash
gps accounts add phosum --credentials /secrets/phosum-sa.json --default-package com.phosum --default
gps accounts add acme --credentials /secrets/acme-sa.json --default-package com.acme.app

gps apps add com.phosum --account phosum --name Phosum --default
gps apps add com.other.app --account phosum --name Other
gps apps add com.acme.app --account acme --name Acme

gps accounts list
gps apps list
gps apps check
```

## Switching

```bash
gps --account phosum tracks list
gps --account acme --package com.acme.app reviews list
gps accounts use acme
```

If a package is registered under exactly one account, `--account` can be omitted.

MCP: optional tool arg `account`; tools `gps_list_accounts`, `gps_list_apps`, `gps_register_account`, `gps_register_app`.
