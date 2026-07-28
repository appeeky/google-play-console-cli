import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ClientRegistry,
  GPS_OPS,
  searchCapabilities,
  CAPABILITIES,
} from "@appeeky/google-play-store-core";

function text(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }, null, 2) }],
    isError: true,
  };
}

const accountField = z
  .string()
  .optional()
  .describe("Named account id from ~/.config/gps/config.json (multi-key)");

export function registerTools(server: McpServer, registry: ClientRegistry): void {
  server.tool(
    "gps_search_capabilities",
    "Search available Google Play Store operations",
    { query: z.string().optional().describe("Search query") },
    async ({ query }) => text(searchCapabilities(query ?? "")),
  );

  server.tool(
    "gps_list_capabilities",
    "List all Google Play Store operations",
    {},
    async () => text(CAPABILITIES),
  );

  for (const op of GPS_OPS) {
    const shape = { ...op.shape, account: accountField };
    server.tool(op.name, op.summary, shape, async (args) => {
      try {
        const record = args as Record<string, unknown>;
        const { client, accountId } = await registry.getClientForArgs({
          account: record.account as string | undefined,
          packageName: record.packageName as string | undefined,
        });
        const result = await op.run(client, record);
        if (
          accountId &&
          result &&
          typeof result === "object" &&
          !Array.isArray(result)
        ) {
          return text({ account: accountId, ...(result as object) });
        }
        return text(result);
      } catch (error) {
        return toolError(error);
      }
    });
  }
}
