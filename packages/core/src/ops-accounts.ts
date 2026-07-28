import { z } from "zod";
import type { GpsOp } from "./ops-part1.js";
import {
  addAppToConfig,
  defaultConfigPath,
  loadConfig,
  removeAppFromConfig,
  saveConfig,
  upsertAccount,
} from "./config.js";
import { ClientRegistry } from "./registry.js";
import { assertPackageName } from "./validation.js";
import { ReadOnlyError } from "./errors.js";

/**
 * Config / multi-account operations.
 * Note: Android Publisher API cannot list developer apps — the local registry is required for gps apps list.
 */
export const GPS_OPS_ACCOUNTS: GpsOp[] = [
  {
    name: "gps_list_accounts",
    group: "accounts",
    summary: "List configured Play developer accounts (local multi-key registry)",
    write: false,
    shape: {},
    run: async () => {
      const registry = ClientRegistry.load();
      return {
        configPath: registry.configPath,
        accounts: registry.listAccounts(),
        note: "One service account key can access many apps if granted in Play Console. Google Publisher API has no list-apps endpoint; register packages with gps_register_app.",
      };
    },
  },
  {
    name: "gps_list_apps",
    group: "accounts",
    summary: "List locally registered apps (optionally filtered by account)",
    write: false,
    shape: { account: z.string().optional().describe("Account id") },
    run: async (_c, a) => {
      const registry = ClientRegistry.load();
      return {
        configPath: registry.configPath,
        apps: registry.listApps(a.account as string | undefined),
        note: "These packages are stored in ~/.config/gps/config.json. Publisher API cannot enumerate apps.",
      };
    },
  },
  {
    name: "gps_register_account",
    group: "accounts",
    summary: "Register or update a named account with a service-account key path",
    write: true,
    shape: {
      account: z.string().describe("Account id, e.g. phosum"),
      credentialsPath: z.string().describe("Absolute path to SA JSON key"),
      developerId: z.string().optional(),
      defaultPackage: z.string().optional(),
      setDefault: z.boolean().optional(),
    },
    run: async (c, a) => {
      if (c.readOnly) throw new ReadOnlyError("gps_register_account");
      const path = defaultConfigPath();
      let config = loadConfig(path);
      const accountId = String(a.account);
      config = upsertAccount(config, accountId, {
        credentialsPath: String(a.credentialsPath),
        developerId: a.developerId as string | undefined,
        defaultPackage: a.defaultPackage as string | undefined,
      });
      if (a.setDefault || !config.defaultAccount) config.defaultAccount = accountId;
      saveConfig(config, path);
      return { ok: true, account: accountId, configPath: path };
    },
  },
  {
    name: "gps_register_app",
    group: "accounts",
    summary: "Register a package name under an account (local app registry)",
    write: true,
    shape: {
      account: z.string().describe("Account id"),
      packageName: z.string(),
      displayName: z.string().optional(),
      setDefaultPackage: z.boolean().optional(),
    },
    run: async (c, a) => {
      if (c.readOnly) throw new ReadOnlyError("gps_register_app");
      const path = defaultConfigPath();
      let config = loadConfig(path);
      const accountId = String(a.account);
      const packageName = String(a.packageName);
      assertPackageName(packageName);
      if (!config.accounts?.[accountId]) {
        throw new Error(`Unknown account "${accountId}". Call gps_register_account first.`);
      }
      config = addAppToConfig(config, accountId, {
        packageName,
        displayName: a.displayName as string | undefined,
      });
      if (a.setDefaultPackage) {
        config = upsertAccount(config, accountId, { defaultPackage: packageName });
      }
      saveConfig(config, path);
      return { ok: true, account: accountId, packageName, configPath: path };
    },
  },
  {
    name: "gps_unregister_app",
    group: "accounts",
    summary: "Remove a package from the local app registry",
    write: true,
    shape: { account: z.string(), packageName: z.string() },
    run: async (c, a) => {
      if (c.readOnly) throw new ReadOnlyError("gps_unregister_app");
      const path = defaultConfigPath();
      let config = loadConfig(path);
      config = removeAppFromConfig(config, String(a.account), String(a.packageName));
      saveConfig(config, path);
      return { ok: true, configPath: path };
    },
  },
  {
    name: "gps_set_default_account",
    group: "accounts",
    summary: "Set the default account id in local config",
    write: true,
    shape: { account: z.string() },
    run: async (c, a) => {
      if (c.readOnly) throw new ReadOnlyError("gps_set_default_account");
      const path = defaultConfigPath();
      const config = loadConfig(path);
      const accountId = String(a.account);
      if (!config.accounts?.[accountId]) {
        throw new Error(`Unknown account "${accountId}"`);
      }
      config.defaultAccount = accountId;
      saveConfig(config, path);
      return { ok: true, defaultAccount: accountId, configPath: path };
    },
  },
];
