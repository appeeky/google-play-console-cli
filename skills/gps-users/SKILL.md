---
name: gps-users
description: >-
  Manage Play Console users and app grants with gps ops/MCP. Use when inviting
  collaborators, listing account users, or granting/revoking app-level access.
---

# Play Console users and grants

These flows are exposed primarily via the ops registry / MCP (not always as short CLI verbs).

```bash
gps ops users
gps call gps_list_users '{"developerId":"DEVELOPER_ID"}'
```

Common ops:

| Op | Purpose |
|----|---------|
| `gps_list_users` | List users |
| `gps_create_user` | Invite / create user |
| `gps_patch_user` | Update user |
| `gps_delete_user` | Remove user |
| `gps_create_grant` | Grant app access |
| `gps_patch_grant` | Update grant |
| `gps_delete_grant` | Remove grant |

## Agent rules

- Destructive user/grant changes need explicit user confirmation.
- You need the Play **developer account id** for list/create user calls.
- Prefer grants scoped to the target app package rather than broad account admin when the user only asked for app access.
