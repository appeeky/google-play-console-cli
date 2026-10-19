/**
 * Hosted gps: Google Play Console for agents and scripts, on the Google Play
 * connection a user already set up in Appeeky.
 *
 *   POST /mcp              remote MCP (streamable HTTP, stateless)
 *   GET  /v1/ops           operations this caller can run
 *   POST /v1/ops/:name     run one operation, JSON args in the body
 *   GET  /health
 *
 * Auth: the user's Appeeky API key (Authorization: Bearer … or X-API-Key).
 * Read-only unless the caller sends X-GPS-Allow-Writes: true.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { PlayStoreClient } from "@appeeky/google-play-store-core";
import { registerTools, type ClientSource } from "@appeeky/google-play-store-mcp";
import { hostedOps } from "./hosted-ops.js";
import { fetchPlaySession, SessionError, type PlaySession, type SessionConfig } from "./session.js";

const MAX_BODY_BYTES = 1024 * 1024;

const INSTRUCTIONS = `Google Play Console through the user's Appeeky connection.
Call gps_list_apps first to see which packages the connected service account can use.
Write operations (releases, listings, prices, refunds…) are hidden unless the client sends the header X-GPS-Allow-Writes: true.
Uploading bundles, APKs or images needs a local file, so use the gps CLI for those.`;

export interface AppConfig extends SessionConfig {
  version?: string;
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(body));
}

function sendError(res: ServerResponse, status: number, code: string, message: string): void {
  sendJson(res, status, { error: { code, message } });
}

function readApiKey(req: IncomingMessage): string | null {
  const header = req.headers["x-api-key"];
  if (typeof header === "string" && header.trim()) return header.trim();
  const auth = req.headers.authorization;
  const match = typeof auth === "string" ? auth.match(/^Bearer\s+(.+)$/i) : null;
  return match?.[1]?.trim() || null;
}

function allowsWrites(req: IncomingMessage): boolean {
  return String(req.headers["x-gps-allow-writes"] ?? "").toLowerCase() === "true";
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "BODY_TOO_LARGE", "Request body is over 1 MB.");
    chunks.push(chunk as Buffer);
  }
  if (size === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be JSON.");
  }
}

/**
 * Clients for one HTTP request. The Appeeky session is fetched on the first
 * tool call that needs Google, so initialize and tools/list stay free.
 */
function sessionSource(apiKey: string, readOnly: boolean, config: SessionConfig) {
  let pending: Promise<PlaySession> | null = null;
  const session = () => (pending ??= fetchPlaySession(apiKey, config));
  const source: ClientSource = {
    async getClientForArgs() {
      const s = await session();
      return {
        client: PlayStoreClient.fromAccessToken(s.accessToken, {
          clientEmail: s.serviceAccountEmail,
          readOnly,
        }),
      };
    },
  };
  return { session, source };
}

function appsResult(s: PlaySession) {
  return {
    serviceAccountEmail: s.serviceAccountEmail,
    defaultPackageName: s.defaultPackageName,
    apps: s.apps,
    note: "Apps the connected service account was last seen with in Appeeky. Grant it more apps in Play Console → Users and permissions.",
  };
}

function buildMcpServer(apiKey: string, allowWrites: boolean, config: AppConfig): McpServer {
  const server = new McpServer(
    { name: "appeeky-google-play", version: config.version ?? "0.1.0" },
    { instructions: INSTRUCTIONS },
  );
  const { session, source } = sessionSource(apiKey, !allowWrites, config);

  server.tool(
    "gps_list_apps",
    "List the Google Play apps the connected service account can use",
    {},
    async () => {
      try {
        return { content: [{ type: "text" as const, text: JSON.stringify(appsResult(await session()), null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true };
      }
    },
  );
  registerTools(server, source, { ops: hostedOps(allowWrites), accountArg: false });
  return server;
}

async function handleMcp(req: IncomingMessage, res: ServerResponse, apiKey: string, config: AppConfig) {
  if (req.method !== "POST") {
    // Stateless server: no SSE stream to resume and no session to delete.
    res.setHeader("allow", "POST");
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Use POST for MCP requests.");
    return;
  }
  const body = await readBody(req);
  const server = buildMcpServer(apiKey, allowsWrites(req), config);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}

async function handleRest(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  apiKey: string,
  config: AppConfig,
) {
  const allowWrites = allowsWrites(req);
  const ops = hostedOps(allowWrites);

  if (path === "/v1/ops" && req.method === "GET") {
    sendJson(res, 200, {
      data: ops.map((op) => ({ name: op.name, group: op.group, summary: op.summary, write: op.write })),
    });
    return;
  }
  if (path === "/v1/apps" && req.method === "GET") {
    const { session } = sessionSource(apiKey, true, config);
    sendJson(res, 200, { data: appsResult(await session()) });
    return;
  }

  const match = path.match(/^\/v1\/ops\/([a-z0-9_]+)$/);
  if (!match || req.method !== "POST") {
    sendError(res, 404, "NOT_FOUND", "Not found.");
    return;
  }
  const op = ops.find((o) => o.name === match[1]);
  if (!op) {
    const hiddenWrite = !allowWrites && hostedOps(true).some((o) => o.name === match[1]);
    sendError(
      res,
      hiddenWrite ? 403 : 404,
      hiddenWrite ? "WRITES_DISABLED" : "UNKNOWN_OPERATION",
      hiddenWrite
        ? `${match[1]} changes your Play Console. Send X-GPS-Allow-Writes: true to run it.`
        : `Unknown or CLI-only operation: ${match[1]}`,
    );
    return;
  }

  const body = (await readBody(req)) ?? {};
  if (typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "INVALID_ARGS", "Body must be a JSON object of operation arguments.");
  }
  const parsed = z.object(op.shape).safeParse(body);
  if (!parsed.success) {
    sendJson(res, 400, {
      error: { code: "INVALID_ARGS", message: "Invalid arguments.", details: parsed.error.issues },
    });
    return;
  }
  const { source } = sessionSource(apiKey, !allowWrites, config);
  const { client } = await source.getClientForArgs({});
  sendJson(res, 200, { data: await op.run(client, parsed.data as Record<string, unknown>) });
}

export function createHandler(config: AppConfig) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    try {
      if (path === "/health") {
        sendJson(res, 200, { ok: true });
        return;
      }
      const apiKey = readApiKey(req);
      if (!apiKey) {
        sendError(res, 401, "MISSING_API_KEY", "Pass your Appeeky API key as Authorization: Bearer <key> or X-API-Key.");
        return;
      }
      if (path === "/mcp") {
        await handleMcp(req, res, apiKey, config);
        return;
      }
      await handleRest(req, res, path, apiKey, config);
    } catch (error) {
      if (res.headersSent) return;
      if (error instanceof HttpError || error instanceof SessionError) {
        sendError(res, error.status, error.code, error.message);
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      // Play API errors carry Google's message; they are the caller's to read.
      sendError(res, 502, "GOOGLE_PLAY_ERROR", message);
    }
  };
}
