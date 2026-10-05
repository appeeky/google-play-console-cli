import { Command } from "commander";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ClientRegistry,
  searchCapabilities,
  CAPABILITIES,
  listOps,
  getOp,
  invokeOp,
  loadConfig,
  saveConfig,
  defaultConfigPath,
  upsertAccount,
  addAppToConfig,
  removeAppFromConfig,
  type PlayStoreClient,
} from "@appeeky/google-play-store-core";
import { printJson, printTable, requireConfirm } from "./output.js";

export interface GlobalOpts {
  credentials?: string;
  package?: string;
  account?: string;
  json?: boolean;
  readOnly?: boolean;
  confirm?: boolean;
}

function registryFrom(opts: GlobalOpts): ClientRegistry {
  return ClientRegistry.load({
    credentials: opts.credentials,
    account: opts.account,
    readOnly: opts.readOnly,
  });
}

async function clientFrom(opts: GlobalOpts, packageName?: string): Promise<PlayStoreClient> {
  const registry = registryFrom(opts);
  const { client } = await registry.getClientForArgs({
    account: opts.account,
    packageName: packageName ?? opts.package,
  });
  return client;
}

function pkg(opts: GlobalOpts, explicit?: string): string {
  const value = explicit ?? opts.package;
  if (value) return value;
  const registry = registryFrom(opts);
  const fallback = registry.defaultPackage(opts.account);
  if (fallback) return fallback;
  throw new Error(
    "Package name required. Pass --package, set account defaultPackage, or register apps in ~/.config/gps/config.json",
  );
}

function resolveSkillsDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(process.cwd(), "skills"),
    join(here, "../skills"), // published package: dist/ -> skills/
    join(here, "../../../skills"), // monorepo: packages/cli/dist -> repo root
    join(here, "../../skills"),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, "gps-cli", "SKILL.md"))) return dir;
  }
  throw new Error(
    "Could not find skills/ directory. From the repo: npx skills add ./skills --skill '*' -a cursor -a claude-code -g -y",
  );
}

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("gps")
    .description("Google Play Store CLI — Android Publisher API v3")
    .version("0.1.0")
    .option("-c, --credentials <pathOrJson>", "Service account JSON path or inline JSON")
    .option("-a, --account <id>", "Named account from ~/.config/gps/config.json")
    .option("-p, --package <packageName>", "Default application package name")
    .option("--json", "Emit machine-readable JSON", false)
    .option("--read-only", "Block write operations", false)
    .option("--confirm", "Confirm destructive write operations", false);

  program
    .command("whoami")
    .description("Show the authenticated service account email")
    .action(async () => {
      const opts = program.opts<GlobalOpts>();
      const registry = registryFrom(opts);
      const { client, accountId } = await registry.getClientForArgs({
        account: opts.account,
        packageName: opts.package,
      });
      const payload = {
        clientEmail: client.clientEmail,
        readOnly: client.readOnly,
        account: accountId,
        defaultPackage: registry.defaultPackage(accountId),
      };
      if (opts.json) printJson(payload);
      else {
        console.log(client.clientEmail);
        if (accountId) console.log(`account: ${accountId}`);
      }
    });

  program
    .command("install-skills")
    .description("Install gps agent skills for Cursor, Claude Code, and other agents")
    .option("-a, --agent <agents...>", "Target agents", ["cursor", "claude-code"])
    .option("-g, --global", "Install to user skill directories (recommended)", true)
    .option("--no-global", "Install into the current project only")
    .option("-y, --yes", "Skip confirmation prompts", true)
    .action((cmdOpts: { agent?: string[]; global?: boolean; yes?: boolean }) => {
      const skillsDir = resolveSkillsDir();
      const agents = cmdOpts.agent?.length ? cmdOpts.agent : ["cursor", "claude-code"];
      const args = ["skills", "add", skillsDir, "--skill", "*"];
      for (const agent of agents) {
        args.push("-a", agent);
      }
      if (cmdOpts.global !== false) args.push("-g");
      if (cmdOpts.yes !== false) args.push("-y");

      console.log(`Installing skills from ${skillsDir}`);
      console.log(`npx ${args.join(" ")}`);
      const result = spawnSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
      if (result.status !== 0) {
        throw new Error(`skills install failed with exit code ${result.status ?? 1}`);
      }
      console.log("Done. Restart your agent / IDE window so skills are discovered.");
    });

  // ── Accounts / apps (multi-key local registry) ─────────────────
  const accounts = program
    .command("accounts")
    .description("Manage named service-account keys (multi-account)");

  accounts
    .command("list")
    .description("List configured accounts")
    .action(async () => {
      const opts = program.opts<GlobalOpts>();
      const registry = registryFrom(opts);
      const rows = registry.listAccounts();
      if (opts.json) printJson({ configPath: registry.configPath, accounts: rows });
      else if (rows.length === 0) {
        console.log(`No accounts in ${registry.configPath}`);
        console.log("Add one: gps accounts add <id> --credentials /path/to/sa.json");
      } else {
        printTable(
          rows.map((r) => ({
            id: r.id,
            isDefault: r.isDefault,
            defaultPackage: r.defaultPackage,
            appCount: r.appCount,
            credentialsPath: r.credentialsPath,
          })),
        );
      }
    });

  accounts
    .command("add")
    .description("Register a named account key")
    .argument("<id>", "Account id (e.g. phosum)")
    .requiredOption("--credentials <path>", "Path to service-account JSON")
    .option("--developer-id <id>", "Play developer account id")
    .option("--default-package <packageName>", "Default package for this account")
    .option("--default", "Set as default account", false)
    .action(
      async (
        id: string,
        cmdOpts: {
          credentials: string;
          developerId?: string;
          defaultPackage?: string;
          default?: boolean;
        },
      ) => {
        const path = defaultConfigPath();
        let config = loadConfig(path);
        config = upsertAccount(config, id, {
          credentialsPath: cmdOpts.credentials,
          developerId: cmdOpts.developerId,
          defaultPackage: cmdOpts.defaultPackage,
        });
        if (cmdOpts.default || !config.defaultAccount) config.defaultAccount = id;
        saveConfig(config, path);
        printJson({ ok: true, account: id, configPath: path });
      },
    );

  accounts
    .command("use")
    .description("Set the default account")
    .argument("<id>")
    .action(async (id: string) => {
      const path = defaultConfigPath();
      const config = loadConfig(path);
      if (!config.accounts?.[id]) throw new Error(`Unknown account: ${id}`);
      config.defaultAccount = id;
      saveConfig(config, path);
      printJson({ ok: true, defaultAccount: id, configPath: path });
    });

  const apps = program
    .command("apps")
    .description("Local app registry (Publisher API cannot list apps)");

  apps
    .command("list")
    .description("List registered apps")
    .option("--account <id>", "Filter by account")
    .action(async (cmdOpts: { account?: string }) => {
      const opts = program.opts<GlobalOpts>();
      const registry = registryFrom(opts);
      const rows = registry.listApps(cmdOpts.account ?? opts.account);
      if (opts.json) printJson({ configPath: registry.configPath, apps: rows });
      else if (rows.length === 0) {
        console.log("No apps registered. Google Publisher API has no list-apps.");
        console.log("Add: gps apps add com.example.app --account phosum --name \"My App\"");
      }       else printTable(
        rows.map((r) => ({
          accountId: r.accountId,
          packageName: r.packageName,
          displayName: r.displayName,
          defaultPackage: r.defaultPackage,
        })),
      );
    });

  apps
    .command("add")
    .description("Register a package under an account")
    .argument("<packageName>")
    .requiredOption("--account <id>", "Account id")
    .option("--name <displayName>", "Display name")
    .option("--default", "Set as account default package", false)
    .action(
      async (
        packageName: string,
        cmdOpts: { account: string; name?: string; default?: boolean },
      ) => {
        const path = defaultConfigPath();
        let config = loadConfig(path);
        if (!config.accounts?.[cmdOpts.account]) {
          throw new Error(`Unknown account ${cmdOpts.account}. Run: gps accounts add ...`);
        }
        config = addAppToConfig(config, cmdOpts.account, {
          packageName,
          displayName: cmdOpts.name,
        });
        if (cmdOpts.default) {
          config = upsertAccount(config, cmdOpts.account, { defaultPackage: packageName });
        }
        saveConfig(config, path);
        printJson({ ok: true, account: cmdOpts.account, packageName, configPath: path });
      },
    );

  apps
    .command("remove")
    .argument("<packageName>")
    .requiredOption("--account <id>")
    .action(async (packageName: string, cmdOpts: { account: string }) => {
      const path = defaultConfigPath();
      let config = loadConfig(path);
      config = removeAppFromConfig(config, cmdOpts.account, packageName);
      saveConfig(config, path);
      printJson({ ok: true, configPath: path });
    });

  apps
    .command("check")
    .description("Probe registered apps with a lightweight listings read")
    .option("--account <id>")
    .action(async (cmdOpts: { account?: string }) => {
      const opts = program.opts<GlobalOpts>();
      const registry = registryFrom(opts);
      const rows = registry.listApps(cmdOpts.account ?? opts.account);
      const results = [];
      for (const app of rows) {
        try {
          const client = await registry.getClient(app.accountId);
          const listings = await client.listings.listAllListings(app.packageName);
          results.push({
            accountId: app.accountId,
            packageName: app.packageName,
            ok: true,
            locales: listings.length,
            title: listings[0]?.title,
          });
        } catch (error) {
          results.push({
            accountId: app.accountId,
            packageName: app.packageName,
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      printJson(results);
    });

  program
    .command("search")
    .description("Search available capabilities")
    .argument("[query]", "Search query", "")
    .action(async (query: string) => {
      const opts = program.opts<GlobalOpts>();
      const hits = searchCapabilities(query);
      if (opts.json) printJson(hits);
      else printTable(hits.map((h) => ({ id: h.id, group: h.group, write: h.write, summary: h.summary })));
    });

  program
    .command("capabilities")
    .description("List all capabilities")
    .action(async () => {
      const opts = program.opts<GlobalOpts>();
      if (opts.json) printJson(CAPABILITIES);
      else printTable(CAPABILITIES.map((h) => ({ id: h.id, group: h.group, write: h.write, summary: h.summary })));
    });

  // ── Reviews ────────────────────────────────────────────────────
  const reviews = program.command("reviews").description("Manage Play Store reviews");

  reviews
    .command("list")
    .description("List reviews")
    .option("--max-results <n>", "Max results", (v) => Number(v))
    .option("--token <token>", "Pagination token")
    .option("--translation-language <lang>", "Translate review text to this language")
    .action(
      async (cmdOpts: {
        maxResults?: number;
        token?: string;
        translationLanguage?: string;
      }) => {
        const opts = program.opts<GlobalOpts>();
        const client = await clientFrom(opts);
        const result = await client.reviews.list(pkg(opts), {
          maxResults: cmdOpts.maxResults,
          token: cmdOpts.token,
          translationLanguage: cmdOpts.translationLanguage,
        });
        if (opts.json) printJson(result);
        else
          printTable(
            result.reviews.map((r) => ({
              id: r.reviewId,
              author: r.authorName,
              star: r.comments?.[0]?.userComment?.starRating,
              text: r.comments?.[0]?.userComment?.text?.slice(0, 80),
            })),
          );
      },
    );

  reviews
    .command("get")
    .description("Get a review by id")
    .argument("<reviewId>")
    .action(async (reviewId: string) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      const result = await client.reviews.get(pkg(opts), reviewId);
      printJson(result);
    });

  reviews
    .command("reply")
    .description("Reply to a review")
    .argument("<reviewId>")
    .argument("<replyText>")
    .action(async (reviewId: string, replyText: string) => {
      const opts = program.opts<GlobalOpts>();
      requireConfirm(opts, "reviews.reply");
      const client = await clientFrom(opts);
      const result = await client.reviews.reply(pkg(opts), reviewId, replyText);
      printJson(result);
    });

  // ── Tracks ─────────────────────────────────────────────────────
  const tracks = program.command("tracks").description("Manage release tracks");

  tracks
    .command("list")
    .description("List tracks (opens a temporary edit)")
    .action(async () => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      // listCommitted uses withEdit which is a write (insert+commit). For read-only,
      // insert is blocked — use validateOnly-style: we'll call withEdit which needs write.
      // Better approach for list: insert is write. Document that tracks list needs write perms
      // OR use listCommitted only when not read-only.
      if (opts.readOnly) {
        throw new Error(
          "tracks list requires opening an edit (write). Run without --read-only.",
        );
      }
      const result = await client.tracks.listCommitted(pkg(opts));
      if (opts.json) printJson(result);
      else
        printTable(
          result.map((t) => ({
            track: t.track,
            releases: t.releases?.length ?? 0,
            status: t.releases?.[0]?.status,
          })),
        );
    });

  tracks
    .command("get")
    .description("Get a track inside a temporary edit")
    .argument("<track>")
    .action(async (track: string) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      const result = await client.edits.withEphemeralEdit(pkg(opts), async (editId) =>
        client.tracks.get(pkg(opts), editId, track),
      );
      printJson(result);
    });

  tracks
    .command("releases")
    .description("List release lifecycle states without opening an edit")
    .argument("<track>")
    .option("--version-code <code>", "Match an exact active artifact version code")
    .action(async (track: string, cmdOpts: { versionCode?: string }) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      const packageName = pkg(opts);
      const result = await client.tracks.listReleaseSummaries(packageName, track, {
        versionCode: cmdOpts.versionCode,
      });
      if (cmdOpts.versionCode !== undefined && result.length === 0) {
        throw new Error(
          `No active release with version code ${cmdOpts.versionCode} exists on track ${track}`,
        );
      }
      if (opts.json) printJson(result);
      else
        printTable(
          result.map((release) => ({
            release: release.releaseName,
            track: release.track,
            versionCodes: release.activeArtifacts
              ?.map((artifact) => artifact.versionCode)
              .join(","),
            lifecycleState: release.releaseLifecycleState,
          })),
        );
    });

  tracks
    .command("promote")
    .description("Promote a release from one track to another")
    .requiredOption("--from <track>")
    .requiredOption("--to <track>")
    .option("--user-fraction <n>", "Staged rollout fraction 0-1", (v) => Number(v))
    .option("--validate-only", "Validate without committing", false)
    .action(
      async (cmdOpts: {
        from: string;
        to: string;
        userFraction?: number;
        validateOnly?: boolean;
      }) => {
        const opts = program.opts<GlobalOpts>();
        requireConfirm(opts, "tracks.promote");
        const client = await clientFrom(opts);
        const result = await client.tracks.promoteRelease(pkg(opts), cmdOpts.from, cmdOpts.to, {
          userFraction: cmdOpts.userFraction,
          validateOnly: cmdOpts.validateOnly,
        });
        printJson(result);
      },
    );

  tracks
    .command("rollout")
    .description("Update staged rollout user fraction")
    .argument("<track>")
    .requiredOption("--user-fraction <n>", "Fraction 0-1", (v) => Number(v))
    .option("--validate-only", "Validate without committing", false)
    .action(
      async (track: string, cmdOpts: { userFraction: number; validateOnly?: boolean }) => {
        const opts = program.opts<GlobalOpts>();
        requireConfirm(opts, "tracks.rollout");
        const client = await clientFrom(opts);
        const result = await client.tracks.updateRollout(pkg(opts), track, cmdOpts.userFraction, {
          validateOnly: cmdOpts.validateOnly,
        });
        printJson(result);
      },
    );

  tracks
    .command("halt")
    .description("Halt an in-progress staged rollout")
    .argument("<track>")
    .option("--validate-only", "Validate without committing", false)
    .action(async (track: string, cmdOpts: { validateOnly?: boolean }) => {
      const opts = program.opts<GlobalOpts>();
      requireConfirm(opts, "tracks.halt");
      const client = await clientFrom(opts);
      const result = await client.tracks.haltRelease(pkg(opts), track, {
        validateOnly: cmdOpts.validateOnly,
      });
      printJson(result);
    });

  // ── Deploy ─────────────────────────────────────────────────────
  program
    .command("deploy")
    .description("Upload an APK/AAB and assign it to a track")
    .requiredOption("--file <path>", "Path to .aab or .apk")
    .requiredOption("--track <track>", "Target track")
    .option("--user-fraction <n>", "Staged rollout fraction", (v) => Number(v))
    .option("--release-notes <text>", "Release notes (en-US)")
    .option("--language <lang>", "Release notes language", "en-US")
    .option("--validate-only", "Validate without committing", false)
    .action(
      async (cmdOpts: {
        file: string;
        track: string;
        userFraction?: number;
        releaseNotes?: string;
        language: string;
        validateOnly?: boolean;
      }) => {
        const opts = program.opts<GlobalOpts>();
        requireConfirm(opts, "deploy");
        const client = await clientFrom(opts);
        const result = await client.deploy.deploy(pkg(opts), {
          filePath: cmdOpts.file,
          track: cmdOpts.track,
          userFraction: cmdOpts.userFraction,
          validateOnly: cmdOpts.validateOnly,
          releaseNotes: cmdOpts.releaseNotes
            ? [{ language: cmdOpts.language, text: cmdOpts.releaseNotes }]
            : undefined,
        });
        printJson(result);
      },
    );

  // ── Listings ───────────────────────────────────────────────────
  const listings = program.command("listings").description("Manage store listings");

  listings
    .command("list")
    .description("List all localized listings")
    .action(async () => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      const result = await client.listings.listAllListings(pkg(opts));
      if (opts.json) printJson(result);
      else
        printTable(
          result.map((l) => ({
            language: l.language,
            title: l.title,
            short: l.shortDescription?.slice(0, 40),
          })),
        );
    });

  listings
    .command("get")
    .description("Get a listing for a language")
    .argument("<language>")
    .action(async (language: string) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      const result = await client.edits.withEphemeralEdit(pkg(opts), async (editId) =>
        client.listings.get(pkg(opts), editId, language),
      );
      printJson(result);
    });

  listings
    .command("update")
    .description("Update a listing")
    .argument("<language>")
    .option("--title <title>")
    .option("--short-description <text>")
    .option("--full-description <text>")
    .option("--video <url>")
    .option("--validate-only", "Validate without committing", false)
    .action(
      async (
        language: string,
        cmdOpts: {
          title?: string;
          shortDescription?: string;
          fullDescription?: string;
          video?: string;
          validateOnly?: boolean;
        },
      ) => {
        const opts = program.opts<GlobalOpts>();
        requireConfirm(opts, "listings.update");
        const client = await clientFrom(opts);
        const result = await client.listings.updateListing(
          pkg(opts),
          language,
          {
            language,
            title: cmdOpts.title,
            shortDescription: cmdOpts.shortDescription,
            fullDescription: cmdOpts.fullDescription,
            video: cmdOpts.video,
          },
          { validateOnly: cmdOpts.validateOnly },
        );
        printJson(result);
      },
    );

  // ── Testers ────────────────────────────────────────────────────
  const testers = program.command("testers").description("Manage track testers");

  testers
    .command("get")
    .argument("<track>")
    .action(async (track: string) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      const result = await client.edits.withEphemeralEdit(pkg(opts), async (editId) =>
        client.testers.get(pkg(opts), editId, track),
      );
      printJson(result);
    });

  testers
    .command("update")
    .argument("<track>")
    .option("--google-groups <emails>", "Comma-separated Google Group emails")
    .action(async (track: string, cmdOpts: { googleGroups?: string }) => {
      const opts = program.opts<GlobalOpts>();
      requireConfirm(opts, "testers.update");
      const client = await clientFrom(opts);
      const result = await client.testers.updateTesters(pkg(opts), track, {
        googleGroups: cmdOpts.googleGroups?.split(",").map((s) => s.trim()),
      });
      printJson(result);
    });

  // ── Subscriptions ──────────────────────────────────────────────
  const subs = program.command("subscriptions").description("Manage subscriptions");

  subs
    .command("list")
    .action(async () => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      const result = await client.monetization.listSubscriptions(pkg(opts));
      if (opts.json) printJson(result);
      else
        printTable(
          result.subscriptions.map((s) => ({
            productId: s.productId,
            basePlans: s.basePlans?.length ?? 0,
          })),
        );
    });

  subs
    .command("get")
    .argument("<productId>")
    .action(async (productId: string) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(await client.monetization.getSubscription(pkg(opts), productId));
    });

  subs
    .command("delete")
    .argument("<productId>")
    .action(async (productId: string) => {
      const opts = program.opts<GlobalOpts>();
      requireConfirm(opts, "subscriptions.delete");
      const client = await clientFrom(opts);
      await client.monetization.deleteSubscription(pkg(opts), productId);
      printJson({ deleted: productId });
    });

  // ── One-time products ──────────────────────────────────────────
  const otp = program.command("otp").description("Manage one-time products");

  otp
    .command("list")
    .action(async () => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      const result = await client.monetization.listOneTimeProducts(pkg(opts));
      if (opts.json) printJson(result);
      else
        printTable(
          result.oneTimeProducts.map((p) => ({
            productId: p.productId,
            purchaseOptions: p.purchaseOptions?.length ?? 0,
          })),
        );
    });

  otp
    .command("get")
    .argument("<productId>")
    .action(async (productId: string) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(await client.monetization.getOneTimeProduct(pkg(opts), productId));
    });

  // ── In-app products (legacy) ───────────────────────────────────
  const iap = program.command("iap").description("Manage legacy in-app products");

  iap
    .command("list")
    .action(async () => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      const result = await client.inappproducts.list(pkg(opts));
      if (opts.json) printJson(result);
      else
        printTable(
          result.inappproduct.map((p) => ({
            sku: p.sku,
            status: p.status,
            purchaseType: p.purchaseType,
          })),
        );
    });

  iap
    .command("get")
    .argument("<sku>")
    .action(async (sku: string) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(await client.inappproducts.get(pkg(opts), sku));
    });

  iap
    .command("delete")
    .argument("<sku>")
    .action(async (sku: string) => {
      const opts = program.opts<GlobalOpts>();
      requireConfirm(opts, "iap.delete");
      const client = await clientFrom(opts);
      await client.inappproducts.delete(pkg(opts), sku);
      printJson({ deleted: sku });
    });

  // ── Purchases ──────────────────────────────────────────────────
  const purchases = program.command("purchases").description("Purchase operations");

  purchases
    .command("product")
    .argument("<productId>")
    .argument("<token>")
    .action(async (productId: string, token: string) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(await client.purchases.getProductPurchase(pkg(opts), productId, token));
    });

  purchases
    .command("product-v2")
    .argument("<token>")
    .action(async (token: string) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(await client.purchases.getProductPurchaseV2(pkg(opts), token));
    });

  purchases
    .command("ack-product")
    .argument("<productId>")
    .argument("<token>")
    .action(async (productId: string, token: string) => {
      const opts = program.opts<GlobalOpts>();
      requireConfirm(opts, "purchases.ack-product");
      const client = await clientFrom(opts);
      await client.purchases.acknowledgeProductPurchase(pkg(opts), productId, token);
      printJson({ acknowledged: true });
    });

  purchases
    .command("consume")
    .argument("<productId>")
    .argument("<token>")
    .action(async (productId: string, token: string) => {
      const opts = program.opts<GlobalOpts>();
      requireConfirm(opts, "purchases.consume");
      const client = await clientFrom(opts);
      await client.purchases.consumeProductPurchase(pkg(opts), productId, token);
      printJson({ consumed: true });
    });

  purchases
    .command("subscription")
    .argument("<token>")
    .action(async (token: string) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(await client.purchases.getSubscriptionPurchaseV2(pkg(opts), token));
    });

  purchases
    .command("cancel-subscription")
    .argument("<token>")
    .action(async (token: string) => {
      const opts = program.opts<GlobalOpts>();
      requireConfirm(opts, "purchases.cancel-subscription");
      const client = await clientFrom(opts);
      printJson(await client.purchases.cancelSubscription(pkg(opts), token));
    });

  purchases
    .command("revoke-subscription")
    .argument("<token>")
    .action(async (token: string) => {
      const opts = program.opts<GlobalOpts>();
      requireConfirm(opts, "purchases.revoke-subscription");
      const client = await clientFrom(opts);
      printJson(await client.purchases.revokeSubscription(pkg(opts), token));
    });

  purchases
    .command("voided")
    .option("--start-time <ms>")
    .option("--end-time <ms>")
    .action(async (cmdOpts: { startTime?: string; endTime?: string }) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(
        await client.purchases.listVoidedPurchases(pkg(opts), {
          startTime: cmdOpts.startTime,
          endTime: cmdOpts.endTime,
        }),
      );
    });

  // ── Orders ─────────────────────────────────────────────────────
  const orders = program.command("orders").description("Order operations");

  orders
    .command("get")
    .argument("<orderId>")
    .action(async (orderId: string) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(await client.orders.get(pkg(opts), orderId));
    });

  orders
    .command("refund")
    .argument("<orderId>")
    .option("--revoke", "Also revoke entitlement", false)
    .action(async (orderId: string, cmdOpts: { revoke?: boolean }) => {
      const opts = program.opts<GlobalOpts>();
      requireConfirm(opts, "orders.refund");
      const client = await clientFrom(opts);
      await client.orders.refund(pkg(opts), orderId, { revoke: cmdOpts.revoke });
      printJson({ refunded: orderId, revoke: !!cmdOpts.revoke });
    });

  // ── Users ──────────────────────────────────────────────────────
  const users = program.command("users").description("Play Console users & grants");

  users
    .command("list")
    .requiredOption("--developer-id <id>")
    .action(async (cmdOpts: { developerId: string }) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(await client.users.list(cmdOpts.developerId));
    });

  // ── Internal sharing ───────────────────────────────────────────
  const sharing = program
    .command("internal-sharing")
    .description("Internal app sharing uploads");

  sharing
    .command("upload")
    .requiredOption("--file <path>")
    .action(async (cmdOpts: { file: string }) => {
      const opts = program.opts<GlobalOpts>();
      requireConfirm(opts, "internal-sharing.upload");
      const client = await clientFrom(opts);
      const lower = cmdOpts.file.toLowerCase();
      const result = lower.endsWith(".aab")
        ? await client.internalSharing.uploadBundle(pkg(opts), cmdOpts.file)
        : await client.internalSharing.uploadApk(pkg(opts), cmdOpts.file);
      printJson(result);
    });

  // ── App recovery ───────────────────────────────────────────────
  const recovery = program.command("recovery").description("App recovery actions");

  recovery
    .command("list")
    .option("--version-code <n>")
    .action(async (cmdOpts: { versionCode?: string }) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(
        await client.appRecovery.list(pkg(opts), { versionCode: cmdOpts.versionCode }),
      );
    });

  // ── Device tier configs ────────────────────────────────────────
  program
    .command("device-tiers")
    .description("List device tier configs")
    .action(async () => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(await client.deviceTierConfigs.list(pkg(opts)));
    });

  // ── Pricing ────────────────────────────────────────────────────
  program
    .command("convert-prices")
    .description("Convert a price across regions")
    .requiredOption("--currency <code>")
    .requiredOption("--units <n>")
    .option("--nanos <n>", "Nanos portion", (v) => Number(v), 0)
    .action(async (cmdOpts: { currency: string; units: string; nanos: number }) => {
      const opts = program.opts<GlobalOpts>();
      const client = await clientFrom(opts);
      printJson(
        await client.monetization.convertRegionPrices(pkg(opts), {
          currencyCode: cmdOpts.currency,
          units: cmdOpts.units,
          nanos: cmdOpts.nanos,
        }),
      );
    });

  // ── Generic ops (full API surface) ─────────────────────────────
  program
    .command("ops")
    .description("List all registered operations (same surface as MCP tools)")
    .argument("[query]", "Optional filter", "")
    .action(async (query: string) => {
      const opts = program.opts<GlobalOpts>();
      const ops = listOps(query);
      if (opts.json) {
        printJson(ops.map((op) => ({ name: op.name, group: op.group, write: op.write, summary: op.summary })));
      } else {
        printTable(
          ops.map((op) => ({
            name: op.name,
            group: op.group,
            write: op.write,
            summary: op.summary,
          })),
        );
      }
    });

  program
    .command("call")
    .description("Invoke any registered operation by name with a JSON args object")
    .argument("<opName>", "Operation name (e.g. gps_reviews_list)")
    .argument("[argsJson]", "JSON object of arguments", "{}")
    .action(async (opName: string, argsJson: string) => {
      const opts = program.opts<GlobalOpts>();
      let op;
      try {
        op = getOp(opName);
      } catch {
        throw new Error(`Unknown op: ${opName}. Run: gps ops`);
      }
      if (op.write) requireConfirm(opts, op.name);
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(argsJson) as Record<string, unknown>;
      } catch {
        throw new Error(`Invalid JSON args: ${argsJson}`);
      }
      if (opts.package && args.packageName == null && args.package == null) {
        args.packageName = opts.package;
      }
      const registry = registryFrom(opts);
      const { client } = await registry.getClientForArgs({
        account: (args.account as string | undefined) ?? opts.account,
        packageName: (args.packageName as string | undefined) ?? opts.package,
      });
      printJson(await invokeOp(client, opName, args));
    });

  return program;
}

export async function runCli(argv: string[]): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(argv);
}
