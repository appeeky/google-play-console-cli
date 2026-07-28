import { PlayStoreClient, type PlayStoreClientOptions } from "./client.js";
import {
  credentialsRefForAccount,
  defaultConfigPath,
  findAccountsForPackage,
  getAccount,
  listAccountIds,
  listRegisteredApps,
  loadConfig,
  resolveAccountId,
  type GpsConfig,
  type RegisteredApp,
} from "./config.js";
import { ValidationError } from "./errors.js";

export interface ClientRegistryOptions {
  configPath?: string;
  /** Explicit credentials override (single-account mode) */
  credentials?: string;
  /** Preferred account id */
  account?: string;
  readOnly?: boolean;
}

/**
 * Multi-account client factory.
 * Google Publisher API has no list-apps endpoint — apps come from local config,
 * while one service account may still access many packages if granted in Play Console.
 */
export class ClientRegistry {
  readonly config: GpsConfig;
  readonly configPath: string;
  readonly readOnly: boolean;
  private readonly explicitCredentials?: string;
  private readonly preferredAccount?: string;
  private readonly cache = new Map<string, PlayStoreClient>();

  private constructor(
    config: GpsConfig,
    configPath: string,
    options: ClientRegistryOptions,
  ) {
    this.config = config;
    this.configPath = configPath;
    this.readOnly = options.readOnly ?? false;
    this.explicitCredentials = options.credentials;
    this.preferredAccount = options.account;
  }

  static load(options: ClientRegistryOptions = {}): ClientRegistry {
    const configPath = options.configPath ?? defaultConfigPath();
    const config = loadConfig(configPath);
    return new ClientRegistry(config, configPath, options);
  }

  listAccounts(): Array<{
    id: string;
    developerId?: string;
    defaultPackage?: string;
    appCount: number;
    isDefault: boolean;
    credentialsPath?: string;
  }> {
    const defaultId = resolveAccountId(this.config, this.preferredAccount);
    return listAccountIds(this.config).map((id) => {
      const account = getAccount(this.config, id);
      return {
        id,
        developerId: account.developerId,
        defaultPackage: account.defaultPackage,
        appCount: account.apps?.length ?? (account.defaultPackage ? 1 : 0),
        isDefault: id === defaultId,
        credentialsPath: account.credentialsPath,
      };
    });
  }

  listApps(accountId?: string): RegisteredApp[] {
    return listRegisteredApps(this.config, accountId);
  }

  resolveAccountForArgs(args: {
    account?: string;
    packageName?: string;
  } = {}): string | undefined {
    if (args.account) return resolveAccountId(this.config, args.account);

    if (args.packageName) {
      const matches = findAccountsForPackage(this.config, args.packageName);
      if (matches.length === 1) return matches[0];
      if (matches.length > 1) {
        throw new ValidationError(
          `Package ${args.packageName} is registered under multiple accounts (${matches.join(", ")}). Pass account explicitly.`,
        );
      }
    }

    return resolveAccountId(this.config, this.preferredAccount);
  }

  async getClient(accountId?: string): Promise<PlayStoreClient> {
    // Explicit --credentials / env single key → one anonymous client
    if (this.explicitCredentials) {
      const cacheKey = `explicit:${this.explicitCredentials}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
      const client = await PlayStoreClient.create({
        credentials: this.explicitCredentials,
        readOnly: this.readOnly,
        configPath: this.configPath,
      } satisfies PlayStoreClientOptions);
      this.cache.set(cacheKey, client);
      return client;
    }

    const resolved =
      accountId !== undefined
        ? resolveAccountId(this.config, accountId)
        : resolveAccountId(this.config, this.preferredAccount);

    if (!resolved) {
      // Fall back to legacy env / credentialsPath resolution
      const cacheKey = "legacy-default";
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
      const client = await PlayStoreClient.create({
        readOnly: this.readOnly,
        configPath: this.configPath,
      });
      this.cache.set(cacheKey, client);
      return client;
    }

    const cached = this.cache.get(resolved);
    if (cached) return cached;

    const account = getAccount(this.config, resolved);
    const credentials = credentialsRefForAccount(account);
    if (!credentials) {
      throw new ValidationError(
        `Account "${resolved}" has no credentialsPath. Add one in ${this.configPath}`,
      );
    }

    const client = await PlayStoreClient.create({
      credentials,
      readOnly: this.readOnly,
      configPath: this.configPath,
    });
    this.cache.set(resolved, client);
    return client;
  }

  async getClientForArgs(args: {
    account?: string;
    packageName?: string;
  } = {}): Promise<{ client: PlayStoreClient; accountId?: string }> {
    const accountId = this.resolveAccountForArgs(args);
    const client = await this.getClient(accountId);
    return { client, accountId };
  }

  defaultPackage(accountId?: string): string | undefined {
    const id = accountId ?? resolveAccountId(this.config, this.preferredAccount);
    if (!id) return undefined;
    return this.config.accounts?.[id]?.defaultPackage;
  }
}
