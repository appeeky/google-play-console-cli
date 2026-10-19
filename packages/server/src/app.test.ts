import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHandler } from "./app.js";

const SESSION = {
  accessToken: "ya29.test",
  expiresAt: "2030-01-01T00:00:00.000Z",
  serviceAccountEmail: "play@example.iam.gserviceaccount.com",
  defaultPackageName: "com.example.app",
  apps: [{ packageName: "com.example.app", displayName: "Example" }],
};

let server: Server | undefined;

afterEach(() => {
  server?.close();
  server = undefined;
});

async function start(sessionResponse: { status: number; body: unknown } = { status: 200, body: { data: SESSION } }) {
  const sessionFetch = vi.fn(async () =>
    new Response(JSON.stringify(sessionResponse.body), {
      status: sessionResponse.status,
      headers: { "content-type": "application/json" },
    }),
  );
  server = createServer(
    createHandler({ apiUrl: "http://api.internal", gatewaySecret: "gw-secret", fetch: sessionFetch as typeof fetch }),
  );
  await new Promise<void>((resolve) => server!.listen(0, resolve));
  const base = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
  return { base, sessionFetch };
}

let rpcId = 0;
async function mcp(base: string, method: string, params: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: "Bearer apk_user",
      ...headers,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
  });
  return (await res.json()) as {
    result: { tools: Array<{ name: string }>; content: Array<{ text: string }>; isError?: boolean };
  };
}

describe("hosted gps server", () => {
  it("answers health without a key and refuses requests without one", async () => {
    const { base } = await start();
    expect((await fetch(`${base}/health`)).status).toBe(200);
    const res = await fetch(`${base}/mcp`, { method: "POST", body: "{}" });
    expect(res.status).toBe(401);
  });

  it("lists read-only, hostable tools without touching the Appeeky session", async () => {
    const { base, sessionFetch } = await start();
    const names = (await mcp(base, "tools/list", {})).result.tools.map((t) => t.name);
    expect(names).toContain("gps_list_apps");
    expect(names).toContain("gps_list_reviews");
    expect(names).not.toContain("gps_reply_to_review");
    expect(names).not.toContain("gps_upload_bundle");
    expect(names).not.toContain("gps_register_account");
    expect(sessionFetch).not.toHaveBeenCalled();

    const writable = (await mcp(base, "tools/list", {}, { "x-gps-allow-writes": "true" })).result.tools.map(
      (t) => t.name,
    );
    expect(writable).toContain("gps_reply_to_review");
    expect(writable).not.toContain("gps_upload_bundle");
  });

  it("fetches the session with the user's key and the gateway secret", async () => {
    const { base, sessionFetch } = await start();
    const result = (await mcp(base, "tools/call", { name: "gps_list_apps", arguments: {} })).result;
    expect(JSON.parse(result.content[0].text).apps).toEqual(SESSION.apps);
    const [url, init] = sessionFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api.internal/v1/store-gateway/google-play/session");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer apk_user");
    expect((init.headers as Record<string, string>)["x-store-gateway-secret"]).toBe("gw-secret");
  });

  it("passes Appeeky refusals through as tool errors", async () => {
    const { base } = await start({
      status: 429,
      body: { error: { code: "RATE_LIMIT_EXCEEDED", message: "Monthly credit limit reached." } },
    });
    const result = (await mcp(base, "tools/call", { name: "gps_list_apps", arguments: {} })).result;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Monthly credit limit reached.");
  });

  it("REST keeps writes behind the opt-in header", async () => {
    const { base, sessionFetch } = await start();
    const headers = { authorization: "Bearer apk_user", "content-type": "application/json" };
    const ops = (await (await fetch(`${base}/v1/ops`, { headers })).json()) as { data: Array<{ name: string }> };
    expect(ops.data.some((o) => o.name === "gps_list_tracks")).toBe(true);

    const blocked = await fetch(`${base}/v1/ops/gps_reply_to_review`, { method: "POST", headers, body: "{}" });
    expect(blocked.status).toBe(403);
    const cliOnly = await fetch(`${base}/v1/ops/gps_upload_bundle`, { method: "POST", headers, body: "{}" });
    expect(cliOnly.status).toBe(404);
    const invalid = await fetch(`${base}/v1/ops/gps_list_tracks`, { method: "POST", headers, body: "{}" });
    expect(invalid.status).toBe(400);
    expect(sessionFetch).not.toHaveBeenCalled();
  });
});
