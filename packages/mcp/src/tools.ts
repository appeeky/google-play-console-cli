import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  GPS_OPS,
  type GpsOp,
  type PlayStoreClient,
} from "@appeeky/google-play-store-core";

/** Where tools get a Play client from: the local ClientRegistry or a hosted session. */
export interface ClientSource {
  getClientForArgs(args: {
    account?: string;
    packageName?: string;
  }): Promise<{ client: PlayStoreClient; accountId?: string }>;
}

export interface RegisterToolsOptions {
  /** Operations to expose (default: all). Hosted mode drops local-file ops. */
  ops?: GpsOp[];
  /** Add the `account` argument (multi-key local config). Default true. */
  accountArg?: boolean;
}

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

export function registerTools(
  server: McpServer,
  registry: ClientSource,
  options: RegisterToolsOptions = {},
): void {
  const ops = options.ops ?? GPS_OPS;
  const withAccount = options.accountArg ?? true;
  const capabilities = ops.map((op) => ({
    id: op.name,
    group: op.group,
    summary: op.summary,
    write: op.write,
  }));

  server.tool(
    "gps_search_capabilities",
    "Search available Google Play Store operations",
    { query: z.string().optional().describe("Search query") },
    async ({ query }) => {
      const q = (query ?? "").trim().toLowerCase();
      return text(
        q
          ? capabilities.filter(
              (c) =>
                c.id.toLowerCase().includes(q) ||
                c.group.toLowerCase().includes(q) ||
                c.summary.toLowerCase().includes(q),
            )
          : capabilities,
      );
    },
  );

  server.tool(
    "gps_list_capabilities",
    "List all Google Play Store operations",
    {},
    async () => text(capabilities),
  );

  for (const op of ops) {
    const shape = withAccount ? { ...op.shape, account: accountField } : op.shape;
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
