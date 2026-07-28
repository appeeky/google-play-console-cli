import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const repoSkills = join(pkgRoot, "../../skills");
const dest = join(pkgRoot, "skills");

if (!existsSync(repoSkills)) {
  console.warn("skills/: repo skills not found; skipping copy");
  process.exit(0);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(repoSkills, dest, { recursive: true });
console.log(`Copied skills → ${dest}`);
