import { google, androidpublisher_v3 } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import {
  resolveCredentials,
  type ResolveCredentialsOptions,
  type ServiceAccountCredentials,
} from "./auth.js";
import { ReadOnlyError } from "./errors.js";
import { withRetry } from "./retry.js";
import { EditsApi } from "./resources/edits.js";
import { TracksApi } from "./resources/tracks.js";
import { ArtifactsApi } from "./resources/artifacts.js";
import { ListingsApi } from "./resources/listings.js";
import { ReviewsApi } from "./resources/reviews.js";
import { TestersApi } from "./resources/testers.js";
import { MonetizationApi } from "./resources/monetization.js";
import { InAppProductsApi } from "./resources/inappproducts.js";
import { PurchasesApi } from "./resources/purchases.js";
import { OrdersApi } from "./resources/orders.js";
import { ExternalTransactionsApi } from "./resources/external-transactions.js";
import { UsersApi } from "./resources/users.js";
import { GeneratedApksApi } from "./resources/generated-apks.js";
import { SystemApksApi } from "./resources/system-apks.js";
import { InternalSharingApi } from "./resources/internal-sharing.js";
import { DataSafetyApi } from "./resources/data-safety.js";
import { AppRecoveryApi } from "./resources/app-recovery.js";
import { DeviceTierConfigsApi } from "./resources/device-tier-configs.js";
import { DeployApi } from "./resources/deploy.js";

export const ANDROID_PUBLISHER_SCOPE =
  "https://www.googleapis.com/auth/androidpublisher";

export interface PlayStoreClientOptions extends ResolveCredentialsOptions {
  readOnly?: boolean;
  /** Injected publisher client for tests */
  publisher?: androidpublisher_v3.Androidpublisher;
}

export type AndroidPublisher = androidpublisher_v3.Androidpublisher;

export class PlayStoreClient {
  readonly readOnly: boolean;
  readonly credentials: ServiceAccountCredentials;
  readonly publisher: AndroidPublisher;

  readonly edits: EditsApi;
  readonly tracks: TracksApi;
  readonly artifacts: ArtifactsApi;
  readonly listings: ListingsApi;
  readonly reviews: ReviewsApi;
  readonly testers: TestersApi;
  readonly monetization: MonetizationApi;
  readonly inappproducts: InAppProductsApi;
  readonly purchases: PurchasesApi;
  readonly orders: OrdersApi;
  readonly externalTransactions: ExternalTransactionsApi;
  readonly users: UsersApi;
  readonly generatedApks: GeneratedApksApi;
  readonly systemApks: SystemApksApi;
  readonly internalSharing: InternalSharingApi;
  readonly dataSafety: DataSafetyApi;
  readonly appRecovery: AppRecoveryApi;
  readonly deviceTierConfigs: DeviceTierConfigsApi;
  readonly deploy: DeployApi;

  private constructor(
    credentials: ServiceAccountCredentials,
    publisher: AndroidPublisher,
    readOnly: boolean,
  ) {
    this.credentials = credentials;
    this.publisher = publisher;
    this.readOnly = readOnly;

    this.edits = new EditsApi(this);
    this.tracks = new TracksApi(this);
    this.artifacts = new ArtifactsApi(this);
    this.listings = new ListingsApi(this);
    this.reviews = new ReviewsApi(this);
    this.testers = new TestersApi(this);
    this.monetization = new MonetizationApi(this);
    this.inappproducts = new InAppProductsApi(this);
    this.purchases = new PurchasesApi(this);
    this.orders = new OrdersApi(this);
    this.externalTransactions = new ExternalTransactionsApi(this);
    this.users = new UsersApi(this);
    this.generatedApks = new GeneratedApksApi(this);
    this.systemApks = new SystemApksApi(this);
    this.internalSharing = new InternalSharingApi(this);
    this.dataSafety = new DataSafetyApi(this);
    this.appRecovery = new AppRecoveryApi(this);
    this.deviceTierConfigs = new DeviceTierConfigsApi(this);
    this.deploy = new DeployApi(this);
  }

  static async create(options: PlayStoreClientOptions = {}): Promise<PlayStoreClient> {
    const credentials = resolveCredentials(options);
    if (options.publisher) {
      return new PlayStoreClient(credentials, options.publisher, options.readOnly ?? false);
    }

    const auth = new GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
        project_id: credentials.project_id,
      },
      scopes: [ANDROID_PUBLISHER_SCOPE],
    });
    const authClient = await auth.getClient();

    const publisher = google.androidpublisher({
      version: "v3",
      auth: authClient as never,
    });

    return new PlayStoreClient(credentials, publisher, options.readOnly ?? false);
  }

  /** Test helper: construct with an injected publisher mock */
  static fromPublisher(
    publisher: AndroidPublisher,
    options: { readOnly?: boolean; credentials?: ServiceAccountCredentials } = {},
  ): PlayStoreClient {
    const credentials =
      options.credentials ??
      ({
        client_email: "test@example.iam.gserviceaccount.com",
        private_key: "-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n",
      } satisfies ServiceAccountCredentials);
    return new PlayStoreClient(credentials, publisher, options.readOnly ?? false);
  }

  assertWritable(operation: string): void {
    if (this.readOnly) {
      throw new ReadOnlyError(operation);
    }
  }

  async request<T>(fn: () => Promise<T>): Promise<T> {
    return withRetry(fn);
  }

  get clientEmail(): string {
    return this.credentials.client_email;
  }
}
