import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bak = join(root, "package.json.bak");
const pkg = join(root, "package.json");
const publishCopy = join(root, "package.json.publish");

if (existsSync(bak)) {
  writeFileSync(pkg, readFileSync(bak));
  unlinkSync(bak);
  console.log("Restored package.json after pack");
}
if (existsSync(publishCopy)) unlinkSync(publishCopy);
