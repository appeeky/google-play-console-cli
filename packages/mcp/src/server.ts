import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ClientRegistry } from "@appeeky/google-play-store-core";
import { registerTools } from "./tools.js";

export interface McpServerOptions {
  credentials?: string;
  account?: string;
  readOnly?: boolean;
}

export async function startMcpServer(options: McpServerOptions = {}): Promise<void> {
  const registry = ClientRegistry.load({
    credentials: options.credentials,
    account: options.account,
    readOnly: options.readOnly,
  });

  const server = new McpServer({
    name: "google-play-store",
    version: "0.1.0",
  });

  registerTools(server, registry);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export { registerTools } from "./tools.js";
