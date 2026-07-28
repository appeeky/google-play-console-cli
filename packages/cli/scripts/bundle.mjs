import * as esbuild from "esbuild";
import { chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const shared = {
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  sourcemap: true,
  // Keep heavy/runtime deps external; bundle only our workspace packages.
  external: [
    "commander",
    "googleapis",
    "google-auth-library",
    "zod",
    "@modelcontextprotocol/sdk",
    "@modelcontextprotocol/sdk/*",
  ],
  logLevel: "info",
};

await esbuild.build({
  ...shared,
  entryPoints: [join(root, "src/bin.ts")],
  outfile: join(root, "dist/bin.js"),
});

await esbuild.build({
  ...shared,
  entryPoints: [join(root, "src/mcp-bin.ts")],
  outfile: join(root, "dist/mcp-bin.js"),
});

chmodSync(join(root, "dist/bin.js"), 0o755);
chmodSync(join(root, "dist/mcp-bin.js"), 0o755);

console.log("Bundled gps + gps-mcp into dist/");
