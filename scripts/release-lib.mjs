// Pure helpers for scripts/release.mjs: decide the next version from
// Conventional Commits and render the changelog section.

/** @typedef {{ hash: string, subject: string, body: string }} Commit */
/** @typedef {"major" | "minor" | "patch"} Bump */

const HEADER = /^(\w+)(\([^)]*\))?(!)?:\s*(.+)$/;

/** Parses a Conventional Commit; returns undefined for anything else (merges, plain messages). */
export function parseCommit(commit) {
  const match = HEADER.exec(commit.subject);
  if (!match) return undefined;
  const [, type, scope, bang, description] = match;
  const breaking = Boolean(bang) || /^BREAKING[ -]CHANGE:/m.test(commit.body);
  return { ...commit, type, scope: scope?.slice(1, -1), breaking, description };
}

/** The bump a list of commits asks for, or undefined when none of them is releasable. */
export function bumpFor(commits) {
  let bump;
  for (const commit of commits) {
    const parsed = parseCommit(commit);
    if (!parsed || (parsed.type === "chore" && parsed.scope === "release")) continue;
    if (parsed.breaking) return "major";
    if (parsed.type === "feat") bump = "minor";
    else if ((parsed.type === "fix" || parsed.type === "perf") && bump !== "minor") bump = "patch";
  }
  return bump;
}

/** Applies a bump. While the major version is 0, a breaking change bumps the minor version. */
export function nextVersion(current, bump) {
  const [major, minor, patch] = current.split(".").map(Number);
  if (bump === "major") return major === 0 ? `0.${minor + 1}.0` : `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** Markdown for one release: breaking changes, features and fixes, each line linked to its commit. */
export function renderSection(version, date, commits, repoUrl) {
  const groups = { breaking: [], feat: [], fix: [] };
  for (const commit of commits) {
    const parsed = parseCommit(commit);
    if (!parsed || (parsed.type === "chore" && parsed.scope === "release")) continue;
    const line = `- ${parsed.scope ? `**${parsed.scope}:** ` : ""}${parsed.description} ([${parsed.hash.slice(0, 7)}](${repoUrl}/commit/${parsed.hash}))`;
    if (parsed.breaking) groups.breaking.push(line);
    else if (parsed.type === "feat") groups.feat.push(line);
    else if (parsed.type === "fix" || parsed.type === "perf") groups.fix.push(line);
  }
  const parts = [`## ${version} (${date})`];
  if (groups.breaking.length) parts.push(`### Breaking changes\n\n${groups.breaking.join("\n")}`);
  if (groups.feat.length) parts.push(`### Features\n\n${groups.feat.join("\n")}`);
  if (groups.fix.length) parts.push(`### Fixes\n\n${groups.fix.join("\n")}`);
  return `${parts.join("\n\n")}\n`;
}

/** Inserts a section above the first existing release in the changelog. */
export function prependSection(changelog, section) {
  const first = changelog.search(/^## /m);
  if (first === -1) return `${changelog.trimEnd()}\n\n${section}`;
  return `${changelog.slice(0, first)}${section}\n${changelog.slice(first)}`;
}
