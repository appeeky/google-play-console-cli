# Agent skills

Install these skills so Cursor, Claude Code, Codex, and other agents follow the correct `gps` / `gps-mcp` workflows.

Full guide: [docs/skills/overview.mdx](../docs/skills/overview.mdx) (Get started → Skills).

## Install

```bash
# Recommended
gps install-skills

# Or with the Skills CLI
npx skills add ./skills --skill '*' -a cursor -a claude-code -g -y

# Project-only (no -g)
npx skills add ./skills --skill '*' -a cursor -a claude-code -y
```

| Agent | Project path | Global (`-g`) |
|-------|--------------|----------------|
| Cursor | `.agents/skills/` | `~/.cursor/skills/` |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |

Manual copy also works — each skill is a folder with `SKILL.md`.

## Skills

| Skill | Use for |
|-------|---------|
| [`gps-cli`](./gps-cli/SKILL.md) | General CLI overview and common commands |
| [`gps-accounts`](./gps-accounts/SKILL.md) | Multi-key accounts + local app registry |
| [`gps-auth`](./gps-auth/SKILL.md) | Service account setup, credentials, read-only |
| [`gps-mcp`](./gps-mcp/SKILL.md) | MCP server config and agent tool usage |
| [`gps-ops`](./gps-ops/SKILL.md) | Full registry: `gps ops` / `gps call` / MCP tools |
| [`gps-release`](./gps-release/SKILL.md) | Deploy, promote, staged rollout, halt |
| [`gps-listings`](./gps-listings/SKILL.md) | Store listing text and images |
| [`gps-reviews`](./gps-reviews/SKILL.md) | List and reply to reviews |
| [`gps-testers`](./gps-testers/SKILL.md) | Track tester lists |
| [`gps-monetization`](./gps-monetization/SKILL.md) | Subscriptions, OTP, IAP catalogs |
| [`gps-purchases`](./gps-purchases/SKILL.md) | Purchase tokens, voided, order refunds |
| [`gps-internal-sharing`](./gps-internal-sharing/SKILL.md) | Internal app sharing uploads |
| [`gps-users`](./gps-users/SKILL.md) | Play Console users and grants |
| [`gps-compliance`](./gps-compliance/SKILL.md) | Data safety, app recovery, device tiers |
| [`gps-troubleshooting`](./gps-troubleshooting/SKILL.md) | Auth errors, empty reviews, read-only issues |

## Conventions for agents

1. Run `gps whoami` (or `gps_whoami`) when auth is unclear.
2. Require `--confirm` / explicit user approval for writes.
3. Prefer `--read-only` when the user only asked to inspect.
4. Use dedicated skills for the domain task; fall back to `gps-ops` for advanced APIs.
