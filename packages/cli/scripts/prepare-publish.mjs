/**
 * Prepack: copy skills + README, bundle bins, rewrite package.json for npm
 * (drop private workspace deps; keep only runtime externals).
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(root, "../..");
const repoSkills = join(repoRoot, "skills");
const destSkills = join(root, "skills");
const repoReadme = join(repoRoot, "README.md");
const heroRaw =
  "https://raw.githubusercontent.com/appeeky/google-play-store-cli/main/images/hero.jpg";

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Ensure workspace packages are built (for types / monorepo), then bundle.
run("pnpm", ["--filter", "@appeeky/google-play-store-core", "build"]);
run("pnpm", ["--filter", "@appeeky/google-play-store-mcp", "build"]);
run("node", [join(root, "scripts/bundle.mjs")]);

if (existsSync(repoSkills)) {
  rmSync(destSkills, { recursive: true, force: true });
  mkdirSync(destSkills, { recursive: true });
  cpSync(repoSkills, destSkills, { recursive: true });
  console.log(`Copied skills → ${destSkills}`);
}

if (existsSync(repoReadme)) {
  let readme = readFileSync(repoReadme, "utf8");
  readme = readme.replaceAll("./images/hero.jpg", heroRaw);
  readme = readme.replaceAll("](./docs/", "](https://github.com/appeeky/google-play-store-cli/blob/main/docs/");
  readme = readme.replaceAll("](./CONTRIBUTING.md)", "](https://github.com/appeeky/google-play-store-cli/blob/main/CONTRIBUTING.md)");
  readme = readme.replaceAll("](./LICENSE)", "](https://github.com/appeeky/google-play-store-cli/blob/main/LICENSE)");
  writeFileSync(join(root, "README.md"), readme);
  console.log("Copied README.md for npm");
}

const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const publishPkg = {
  ...pkg,
  dependencies: {
    "@modelcontextprotocol/sdk": pkg.dependencies["@modelcontextprotocol/sdk"],
    commander: pkg.dependencies.commander,
    "google-auth-library": pkg.dependencies["google-auth-library"],
    googleapis: pkg.dependencies.googleapis,
    zod: pkg.dependencies.zod,
  },
  scripts: {},
};
delete publishPkg.devDependencies;

writeFileSync(join(root, "package.json.publish"), JSON.stringify(publishPkg, null, 2) + "\n");
writeFileSync(join(root, "package.json.bak"), readFileSync(pkgPath));
writeFileSync(pkgPath, JSON.stringify(publishPkg, null, 2) + "\n");
console.log("package.json rewritten for publish (workspace deps removed)");
