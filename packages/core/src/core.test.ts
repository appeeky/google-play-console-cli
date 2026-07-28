import { describe, expect, it } from "vitest";
import { resolveCredentials } from "./auth.js";
import { AuthError } from "./errors.js";
import {
  assertPackageName,
  isValidPackageName,
  validateListingText,
  LISTING_LIMITS,
} from "./validation.js";
import { isRetryableError, withRetry } from "./retry.js";
import { searchCapabilities, CAPABILITIES } from "./capabilities.js";
import { GPS_OPS, listOps, getOp } from "./ops.js";
import { PlayStoreClient } from "./client.js";
import { ReadOnlyError, ValidationError } from "./errors.js";
import {
  addAppToConfig,
  findAccountsForPackage,
  listRegisteredApps,
  loadConfig,
  resolveAccountId,
  saveConfig,
  upsertAccount,
} from "./config.js";

describe("auth.resolveCredentials", () => {
  it("parses inline JSON credentials", () => {
    const creds = resolveCredentials({
      credentials: JSON.stringify({
        client_email: "sa@example.iam.gserviceaccount.com",
        private_key: "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n",
      }),
      env: {},
      configPath: "/tmp/gps-missing-config.json",
    });
    expect(creds.client_email).toBe("sa@example.iam.gserviceaccount.com");
    expect(creds.private_key).toContain("BEGIN PRIVATE KEY");
    expect(creds.private_key).not.toContain("\\n");
  });

  it("reads GOOGLE_APPLICATION_CREDENTIALS path via env JSON fallback", () => {
    expect(() =>
      resolveCredentials({
        env: {},
        configPath: "/tmp/gps-definitely-missing.json",
      }),
    ).toThrow(AuthError);
  });
});

describe("validation", () => {
  it("accepts reverse-DNS package names", () => {
    expect(isValidPackageName("com.example.app")).toBe(true);
    expect(isValidPackageName("invalid")).toBe(false);
    expect(() => assertPackageName("bad")).toThrow();
  });

  it("validates listing text lengths", () => {
    const errors = validateListingText({
      title: "x".repeat(LISTING_LIMITS.title + 1),
      shortDescription: "ok",
    });
    expect(errors.some((e) => e.includes("title"))).toBe(true);
  });
});

describe("retry", () => {
  it("retries retryable errors then succeeds", async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          const err = new Error("rate limited") as Error & { status: number };
          err.status = 429;
          throw err;
        }
        return "ok";
      },
      { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 2 },
    );
    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("detects retryable statuses", () => {
    expect(isRetryableError({ status: 503 })).toBe(true);
    expect(isRetryableError({ status: 400 })).toBe(false);
  });
});

describe("capabilities", () => {
  it("searches by query", () => {
    const hits = searchCapabilities("review");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => /review/i.test(h.id + h.summary + h.group))).toBe(true);
  });

  it("returns all when query empty", () => {
    expect(searchCapabilities("").length).toBe(CAPABILITIES.length);
  });
});

describe("ops registry", () => {
  it("has unique names and matches capabilities", () => {
    const names = GPS_OPS.map((op) => op.name);
    expect(new Set(names).size).toBe(names.length);
    expect(CAPABILITIES.length).toBe(GPS_OPS.length);
    expect(listOps("review").some((op) => op.name === "gps_list_reviews")).toBe(true);
    expect(getOp("gps_whoami").group).toBe("meta");
    expect(() => getOp("gps_does_not_exist")).toThrow(ValidationError);
  });
});

describe("PlayStoreClient read-only", () => {
  it("blocks writes in read-only mode", async () => {
    const publisher = {
      edits: {
        insert: async () => ({ data: { id: "1" } }),
      },
      reviews: {
        list: async () => ({ data: { reviews: [] } }),
        reply: async () => ({ data: {} }),
      },
    } as unknown as Parameters<typeof PlayStoreClient.fromPublisher>[0];

    const client = PlayStoreClient.fromPublisher(publisher, { readOnly: true });
    await expect(client.edits.insert("com.example.app")).rejects.toBeInstanceOf(
      ReadOnlyError,
    );
    await expect(
      client.reviews.reply("com.example.app", "r1", "thanks"),
    ).rejects.toBeInstanceOf(ReadOnlyError);
  });

  it("lists reviews via mock publisher", async () => {
    const publisher = {
      reviews: {
        list: async () => ({
          data: {
            reviews: [{ reviewId: "r1", authorName: "Ada" }],
          },
        }),
      },
    } as unknown as Parameters<typeof PlayStoreClient.fromPublisher>[0];

    const client = PlayStoreClient.fromPublisher(publisher);
    const result = await client.reviews.list("com.example.app");
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0]?.reviewId).toBe("r1");
  });
});

describe("edits.withEdit", () => {
  it("commits on success and returns result", async () => {
    const calls: string[] = [];
    const publisher = {
      edits: {
        insert: async () => {
          calls.push("insert");
          return { data: { id: "edit-1" } };
        },
        commit: async () => {
          calls.push("commit");
          return { data: { id: "edit-1" } };
        },
        delete: async () => {
          calls.push("delete");
        },
        tracks: {
          list: async () => {
            calls.push("tracks.list");
            return { data: { tracks: [{ track: "production" }] } };
          },
        },
      },
    } as unknown as Parameters<typeof PlayStoreClient.fromPublisher>[0];

    const client = PlayStoreClient.fromPublisher(publisher);
    const tracks = await client.tracks.list("com.example.app", "edit-1");
    expect(tracks[0]?.track).toBe("production");

    const session = await client.edits.withEdit("com.example.app", async (editId) => {
      expect(editId).toBe("edit-1");
      return { ok: true };
    });
    expect(session.committed).toBe(true);
    expect(session.result).toEqual({ ok: true });
    expect(calls).toContain("insert");
    expect(calls).toContain("commit");
  });
});

describe("config multi-account", () => {
  it("registers accounts and apps and finds package owners", async () => {
    const { mkdtempSync, rmSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const dir = mkdtempSync(join(tmpdir(), "gps-config-"));
    const path = join(dir, "config.json");
    try {
      let config = upsertAccount({}, "phosum", {
        credentialsPath: "/tmp/phosum.json",
        defaultPackage: "com.phosum",
      });
      config = addAppToConfig(config, "phosum", {
        packageName: "com.phosum",
        displayName: "Phosum",
      });
      config = addAppToConfig(config, "phosum", { packageName: "com.other.app" });
      config = upsertAccount(config, "acme", { credentialsPath: "/tmp/acme.json" });
      config = addAppToConfig(config, "acme", { packageName: "com.acme.app" });
      config.defaultAccount = "phosum";
      saveConfig(config, path);

      const loaded = loadConfig(path);
      expect(listRegisteredApps(loaded)).toHaveLength(3);
      expect(findAccountsForPackage(loaded, "com.phosum")).toEqual(["phosum"]);
      expect(resolveAccountId(loaded)).toBe("phosum");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
