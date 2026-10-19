/**
 * Appeeky session: the user's Appeeky API key in, a short-lived Android
 * Publisher token out. The API keeps the service-account key; this service
 * only ever holds the token for one request. Every session is one metered
 * Appeeky API call, so the hosted tools draw from the user's credits.
 */

export interface PlaySession {
  accessToken: string;
  expiresAt: string;
  serviceAccountEmail: string;
  defaultPackageName: string | null;
  apps: Array<{ packageName: string; displayName: string | null }>;
}

export interface SessionConfig {
  /** Appeeky REST API base, private network in production. */
  apiUrl: string;
  /** Shared X-Store-Gateway-Secret. */
  gatewaySecret: string;
  fetch?: typeof fetch;
}

/** A refusal from Appeeky (bad key, no Play connection, out of credits…). */
export class SessionError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SessionError";
  }
}

export async function fetchPlaySession(apiKey: string, config: SessionConfig): Promise<PlaySession> {
  const doFetch = config.fetch ?? fetch;
  let res: Response;
  try {
    res = await doFetch(`${config.apiUrl.replace(/\/+$/, "")}/v1/store-gateway/google-play/session`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "x-store-gateway-secret": config.gatewaySecret,
        "content-type": "application/json",
      },
      body: "{}",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new SessionError(503, "APPEEKY_UNREACHABLE", "Appeeky is unreachable. Try again shortly.");
  }

  const body = (await res.json().catch(() => null)) as
    | { data?: PlaySession; error?: { code?: string; message?: string } }
    | null;
  if (!res.ok || !body?.data?.accessToken) {
    throw new SessionError(
      res.ok ? 502 : res.status,
      body?.error?.code ?? "APPEEKY_ERROR",
      body?.error?.message ?? `Appeeky answered ${res.status}.`,
    );
  }
  return body.data;
}
