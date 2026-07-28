# Contributing

Thanks for contributing to Google Play Store CLI.

## Setup

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Package layout


| Package                   | Path            | Role                                 |
| ------------------------- | --------------- | ------------------------------------ |
| `@appeeky/google-play-store-core` | `packages/core` | Publisher domain logic (private / bundled) |
| `@appeeky/google-play-store-cli`  | `packages/cli`  | Published package: `gps` + `gps-mcp` |
| `@appeeky/google-play-store-mcp`  | `packages/mcp`  | MCP internals (private / bundled) |


Add API coverage in **core** first, register it in the ops registry, then add CLI shortcuts only where they improve common workflows. MCP tools are generated from the registry.

## Agent skills

Workflow skills live in `skills/`. After changing them:

```bash
gps install-skills
```

## Tests

Unit tests mock the googleapis publisher client via `PlayStoreClient.fromPublisher`.

Optional live tests:

```bash
GPS_LIVE_TEST=1 GOOGLE_APPLICATION_CREDENTIALS=./sa.json pnpm test
```

Do not commit service-account keys.

## Docs

Mintlify docs are in `[docs/](./docs)`. Preview with:

```bash
cd docs && npx mintlify dev
```

More detail: [docs/contributing.mdx](./docs/contributing.mdx).