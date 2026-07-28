import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { AuthError } from "./errors.js";

export interface ServiceAccountCredentials {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  universe_domain?: string;
}

export interface ResolveCredentialsOptions {
  /** Path to JSON key file, or inline JSON string */
  credentials?: string;
  env?: NodeJS.ProcessEnv;
  configPath?: string;
}

function isJsonObject(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("{") && trimmed.endsWith("}");
}

function parseCredentialsJson(raw: string, source: string): ServiceAccountCredentials {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new AuthError(`Invalid credentials JSON from ${source}`, cause);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new AuthError(`Credentials from ${source} must be a JSON object`);
  }

  const creds = parsed as Partial<ServiceAccountCredentials>;
  if (!creds.client_email || !creds.private_key) {
    throw new AuthError(
      `Credentials from ${source} must include client_email and private_key`,
    );
  }

  return {
    ...creds,
    client_email: creds.client_email,
    private_key: creds.private_key.replace(/\\n/g, "\n"),
  };
}

function loadFromPath(path: string): ServiceAccountCredentials {
  if (!existsSync(path)) {
    throw new AuthError(`Credentials file not found: ${path}`);
  }
  return parseCredentialsJson(readFileSync(path, "utf8"), path);
}

function loadConfigCredentialsPath(configPath: string): string | undefined {
  if (!existsSync(configPath)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(configPath, "utf8")) as {
      credentialsPath?: string;
    };
    return raw.credentialsPath;
  } catch {
    return undefined;
  }
}

/**
 * Resolve service-account credentials (local-first).
 * Precedence:
 * 1. explicit --credentials path or inline JSON
 * 2. GPS_CREDENTIALS / GOOGLE_PLAY_CREDENTIALS
 * 3. GOOGLE_APPLICATION_CREDENTIALS
 * 4. ~/.config/gps/config.json credentialsPath
 */
export function resolveCredentials(
  options: ResolveCredentialsOptions = {},
): ServiceAccountCredentials {
  const env = options.env ?? process.env;

  if (options.credentials) {
    if (isJsonObject(options.credentials)) {
      return parseCredentialsJson(options.credentials, "inline credentials");
    }
    return loadFromPath(options.credentials);
  }

  for (const key of ["GPS_CREDENTIALS", "GOOGLE_PLAY_CREDENTIALS"] as const) {
    const value = env[key];
    if (!value) continue;
    if (isJsonObject(value)) {
      return parseCredentialsJson(value, key);
    }
    return loadFromPath(value);
  }

  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    return loadFromPath(env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  const configPath =
    options.configPath ?? join(homedir(), ".config", "gps", "config.json");
  const fromConfig = loadConfigCredentialsPath(configPath);
  if (fromConfig) {
    return loadFromPath(fromConfig);
  }

  throw new AuthError(
    "No credentials found. Set --credentials, GPS_CREDENTIALS, GOOGLE_PLAY_CREDENTIALS, or GOOGLE_APPLICATION_CREDENTIALS.",
  );
}
