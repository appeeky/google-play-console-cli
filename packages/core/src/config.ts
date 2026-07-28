import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { AuthError, ValidationError } from "./errors.js";
import { assertPackageName } from "./validation.js";

export interface ConfigApp {
  packageName: string;
  displayName?: string;
}

export interface ConfigAccount {
  /** Path to service-account JSON (preferred) */
  credentialsPath?: string;
  /** Inline SA JSON string (discouraged; prefer path) */
  credentialsJson?: string;
  /** Optional Play developer account id (users/grants APIs) */
  developerId?: string;
  /** Default package when --package omitted */
  defaultPackage?: string;
  /** Known apps this account can operate on (local registry; Google has no Publisher list-apps API) */
  apps?: ConfigApp[];
}

export interface GpsConfig {
  /** Account id used when --account is omitted */
  defaultAccount?: string;
  accounts?: Record<string, ConfigAccount>;
  /** Legacy single-key path (treated as account "default") */
  credentialsPath?: string;
}

export function defaultConfigPath(): string {
  return join(homedir(), ".config", "gps", "config.json");
}

export function loadConfig(configPath = defaultConfigPath()): GpsConfig {
  if (!existsSync(configPath)) return {};
  try {
    const raw = JSON.parse(readFileSync(configPath, "utf8")) as GpsConfig;
    return normalizeConfig(raw);
  } catch (cause) {
    throw new AuthError(`Invalid config at ${configPath}`, cause);
  }
}

function normalizeConfig(raw: GpsConfig): GpsConfig {
  const accounts: Record<string, ConfigAccount> = { ...(raw.accounts ?? {}) };

  // Legacy single credentialsPath → account "default"
  if (raw.credentialsPath) {
    const existing = accounts.default;
    if (!existing) {
      accounts.default = { credentialsPath: raw.credentialsPath };
    } else if (!existing.credentialsPath) {
      accounts.default = { ...existing, credentialsPath: raw.credentialsPath };
    }
  }

  return {
    defaultAccount: raw.defaultAccount,
    accounts,
    credentialsPath: raw.credentialsPath,
  };
}

export function saveConfig(config: GpsConfig, configPath = defaultConfigPath()): void {
  mkdirSync(dirname(configPath), { recursive: true });
  const toWrite: GpsConfig = {
    defaultAccount: config.defaultAccount,
    accounts: config.accounts ?? {},
  };
  // Keep legacy field only if no accounts map / for back-compat readers
  if (config.credentialsPath && (!config.accounts || Object.keys(config.accounts).length === 0)) {
    toWrite.credentialsPath = config.credentialsPath;
  }
  writeFileSync(configPath, `${JSON.stringify(toWrite, null, 2)}\n`, { mode: 0o600 });
}

export function listAccountIds(config: GpsConfig): string[] {
  return Object.keys(config.accounts ?? {}).sort();
}

export function resolveAccountId(
  config: GpsConfig,
  explicit?: string,
): string | undefined {
  if (explicit) {
    if (!config.accounts?.[explicit]) {
      throw new ValidationError(
        `Unknown account "${explicit}". Known: ${listAccountIds(config).join(", ") || "(none)"}`,
      );
    }
    return explicit;
  }
  if (config.defaultAccount && config.accounts?.[config.defaultAccount]) {
    return config.defaultAccount;
  }
  const ids = listAccountIds(config);
  if (ids.length === 1) return ids[0];
  return config.accounts?.default ? "default" : undefined;
}

export function getAccount(config: GpsConfig, accountId: string): ConfigAccount {
  const account = config.accounts?.[accountId];
  if (!account) {
    throw new ValidationError(`Unknown account "${accountId}"`);
  }
  return account;
}

export interface RegisteredApp {
  accountId: string;
  packageName: string;
  displayName?: string;
  developerId?: string;
  defaultPackage?: boolean;
}

export function listRegisteredApps(
  config: GpsConfig,
  accountId?: string,
): RegisteredApp[] {
  const ids = accountId ? [resolveAccountId(config, accountId)!] : listAccountIds(config);
  const out: RegisteredApp[] = [];
  for (const id of ids) {
    if (!id) continue;
    const account = config.accounts?.[id];
    if (!account) continue;
    const apps = account.apps ?? [];
    if (apps.length === 0 && account.defaultPackage) {
      out.push({
        accountId: id,
        packageName: account.defaultPackage,
        developerId: account.developerId,
        defaultPackage: true,
      });
      continue;
    }
    for (const app of apps) {
      out.push({
        accountId: id,
        packageName: app.packageName,
        displayName: app.displayName,
        developerId: account.developerId,
        defaultPackage: account.defaultPackage === app.packageName,
      });
    }
  }
  return out;
}

export function findAccountsForPackage(
  config: GpsConfig,
  packageName: string,
): string[] {
  return listRegisteredApps(config)
    .filter((a) => a.packageName === packageName)
    .map((a) => a.accountId);
}

export function addAppToConfig(
  config: GpsConfig,
  accountId: string,
  app: ConfigApp,
): GpsConfig {
  assertPackageName(app.packageName);
  const accounts = { ...(config.accounts ?? {}) };
  const account = { ...(accounts[accountId] ?? {}) };
  const apps = [...(account.apps ?? [])];
  const idx = apps.findIndex((a) => a.packageName === app.packageName);
  if (idx >= 0) apps[idx] = { ...apps[idx], ...app };
  else apps.push(app);
  account.apps = apps;
  if (!account.defaultPackage) account.defaultPackage = app.packageName;
  accounts[accountId] = account;
  return { ...config, accounts, defaultAccount: config.defaultAccount ?? accountId };
}

export function removeAppFromConfig(
  config: GpsConfig,
  accountId: string,
  packageName: string,
): GpsConfig {
  const accounts = { ...(config.accounts ?? {}) };
  const account = accounts[accountId];
  if (!account) throw new ValidationError(`Unknown account "${accountId}"`);
  const apps = (account.apps ?? []).filter((a) => a.packageName !== packageName);
  const next: ConfigAccount = { ...account, apps };
  if (next.defaultPackage === packageName) {
    next.defaultPackage = apps[0]?.packageName;
  }
  accounts[accountId] = next;
  return { ...config, accounts };
}

export function upsertAccount(
  config: GpsConfig,
  accountId: string,
  patch: ConfigAccount,
): GpsConfig {
  const accounts = { ...(config.accounts ?? {}) };
  accounts[accountId] = { ...(accounts[accountId] ?? {}), ...patch };
  return {
    ...config,
    accounts,
    defaultAccount: config.defaultAccount ?? accountId,
  };
}

export function credentialsRefForAccount(account: ConfigAccount): string | undefined {
  if (account.credentialsPath) return account.credentialsPath;
  if (account.credentialsJson) return account.credentialsJson;
  return undefined;
}
