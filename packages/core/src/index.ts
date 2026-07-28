export {
  PlayStoreClient,
  ANDROID_PUBLISHER_SCOPE,
  type PlayStoreClientOptions,
  type AndroidPublisher,
} from "./client.js";
export {
  resolveCredentials,
  type ServiceAccountCredentials,
  type ResolveCredentialsOptions,
} from "./auth.js";
export {
  GpsError,
  AuthError,
  ValidationError,
  ReadOnlyError,
  ApiError,
} from "./errors.js";
export {
  assertPackageName,
  assertTrack,
  isValidPackageName,
  isStandardTrack,
  validateListingText,
  LISTING_LIMITS,
  STANDARD_TRACKS,
  type StandardTrack,
  type ListingTextInput,
} from "./validation.js";
export { withRetry, isRetryableError, type RetryOptions } from "./retry.js";
export { CAPABILITIES, searchCapabilities, type Capability } from "./capabilities.js";
export {
  GPS_OPS,
  listOps,
  getOp,
  invokeOp,
  type GpsOp,
} from "./ops.js";
export {
  loadConfig,
  saveConfig,
  defaultConfigPath,
  listRegisteredApps,
  addAppToConfig,
  removeAppFromConfig,
  upsertAccount,
  type GpsConfig,
  type ConfigAccount,
  type ConfigApp,
  type RegisteredApp,
} from "./config.js";
export { ClientRegistry, type ClientRegistryOptions } from "./registry.js";

export type { DeployOptions, DeployResult } from "./resources/deploy.js";
export type { ImageType } from "./resources/listings.js";
