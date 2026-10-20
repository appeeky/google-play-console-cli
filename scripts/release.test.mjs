import { describe, expect, it } from "vitest";
import { bumpFor, nextVersion, parseCommit, prependSection, renderSection } from "./release-lib.mjs";

const c = (subject, body = "", hash = "a".repeat(40)) => ({ hash, subject, body });

describe("bumpFor", () => {
  it("releases nothing for docs, chore and merge commits", () => {
    expect(bumpFor([c("docs: tweak"), c("chore: lockfile"), c("Merge pull request #4 from appeeky/x")])).toBeUndefined();
  });

  it("takes the largest bump", () => {
    expect(bumpFor([c("fix: a"), c("docs: b")])).toBe("patch");
    expect(bumpFor([c("fix: a"), c("feat(mcp): b")])).toBe("minor");
    expect(bumpFor([c("feat: a"), c("perf: b")])).toBe("minor");
    expect(bumpFor([c("feat: a"), c("fix!: b")])).toBe("major");
    expect(bumpFor([c("refactor: a", "BREAKING CHANGE: renamed the tool")])).toBe("major");
  });

  it("ignores its own release commits", () => {
    expect(bumpFor([c("chore(release): v0.2.0 [skip ci]")])).toBeUndefined();
  });
});

describe("nextVersion", () => {
  it("bumps by kind", () => {
    expect(nextVersion("1.2.3", "patch")).toBe("1.2.4");
    expect(nextVersion("1.2.3", "minor")).toBe("1.3.0");
    expect(nextVersion("1.2.3", "major")).toBe("2.0.0");
  });

  it("keeps breaking changes on the minor version while at 0.x", () => {
    expect(nextVersion("0.1.0", "major")).toBe("0.2.0");
    expect(nextVersion("0.1.0", "minor")).toBe("0.2.0");
    expect(nextVersion("0.1.0", "patch")).toBe("0.1.1");
  });
});

describe("changelog", () => {
  it("groups commits and links them", () => {
    const section = renderSection(
      "0.2.0",
      "2026-10-04",
      [c("feat(mcp): hosted server", "", "1234567890abcdef1234567890abcdef12345678"), c("fix: token refresh"), c("docs: guide"), c("feat!: rename ops")],
      "https://github.com/appeeky/google-play-console-cli",
    );
    expect(section).toBe(
      [
        "## 0.2.0 (2026-10-04)",
        "",
        "### Breaking changes",
        "",
        `- rename ops ([aaaaaaa](https://github.com/appeeky/google-play-console-cli/commit/${"a".repeat(40)}))`,
        "",
        "### Features",
        "",
        "- **mcp:** hosted server ([1234567](https://github.com/appeeky/google-play-console-cli/commit/1234567890abcdef1234567890abcdef12345678))",
        "",
        "### Fixes",
        "",
        `- token refresh ([aaaaaaa](https://github.com/appeeky/google-play-console-cli/commit/${"a".repeat(40)}))`,
        "",
      ].join("\n"),
    );
  });

  it("goes above the newest release", () => {
    const log = "# Changelog\n\nIntro.\n\n## 0.1.0\n\nFirst.\n";
    expect(prependSection(log, "## 0.2.0 (2026-10-04)\n\n- x\n")).toBe("# Changelog\n\nIntro.\n\n## 0.2.0 (2026-10-04)\n\n- x\n\n## 0.1.0\n\nFirst.\n");
  });

  it("parses scopes and breaking markers", () => {
    expect(parseCommit(c("feat(core)!: x"))).toMatchObject({ type: "feat", scope: "core", breaking: true, description: "x" });
    expect(parseCommit(c("Merge branch 'main'"))).toBeUndefined();
  });
});
