#!/usr/bin/env node
import { parseArgs } from "node:util";
import { startMcpServer } from "@appeeky/google-play-store-mcp";

const { values } = parseArgs({
  options: {
    credentials: { type: "string", short: "c" },
    account: { type: "string", short: "a" },
    "read-only": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`gps-mcp — Google Play Store MCP server

Usage:
  gps-mcp [--credentials <path|json>] [--account <id>] [--read-only]

Environment:
  GPS_CREDENTIALS / GOOGLE_PLAY_CREDENTIALS / GOOGLE_APPLICATION_CREDENTIALS

Multi-account:
  Configure ~/.config/gps/config.json with named accounts and apps.
  Pass --account or tool arg "account". Package names resolve to accounts when unique.
`);
  process.exit(0);
}

startMcpServer({
  credentials: values.credentials,
  account: values.account,
  readOnly: values["read-only"],
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
