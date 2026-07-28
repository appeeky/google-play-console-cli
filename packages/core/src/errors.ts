export class GpsError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;

  constructor(
    message: string,
    options?: { code?: string; status?: number; details?: unknown; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "GpsError";
    this.code = options?.code ?? "GPS_ERROR";
    this.status = options?.status;
    this.details = options?.details;
  }
}

export class AuthError extends GpsError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "AUTH_ERROR", details });
    this.name = "AuthError";
  }
}

export class ValidationError extends GpsError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "VALIDATION_ERROR", details });
    this.name = "ValidationError";
  }
}

export class ReadOnlyError extends GpsError {
  constructor(operation: string) {
    super(`Cannot perform write operation "${operation}" in read-only mode`, {
      code: "READ_ONLY",
    });
    this.name = "ReadOnlyError";
  }
}

export class ApiError extends GpsError {
  constructor(message: string, status?: number, details?: unknown) {
    super(message, { code: "API_ERROR", status, details });
    this.name = "ApiError";
  }
}
