import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type AppRecoveryAction = androidpublisher_v3.Schema$AppRecoveryAction;

export class AppRecoveryApi {
  constructor(private readonly client: PlayStoreClient) {}

  async list(
    packageName: string,
    options: { versionCode?: string | number } = {},
  ): Promise<AppRecoveryAction[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.apprecovery.list({
        packageName,
        versionCode:
          options.versionCode !== undefined ? String(options.versionCode) : undefined,
      });
      return res.data.recoveryActions ?? [];
    });
  }

  async create(
    packageName: string,
    body: androidpublisher_v3.Schema$CreateDraftAppRecoveryRequest,
  ): Promise<AppRecoveryAction> {
    assertPackageName(packageName);
    this.client.assertWritable("appRecovery.create");
    return this.client.request(async () => {
      const res = await this.client.publisher.apprecovery.create({
        packageName,
        requestBody: body,
      });
      return res.data;
    });
  }

  async deploy(
    packageName: string,
    appRecoveryId: string | number,
  ): Promise<AppRecoveryAction> {
    assertPackageName(packageName);
    this.client.assertWritable("appRecovery.deploy");
    return this.client.request(async () => {
      const res = await this.client.publisher.apprecovery.deploy({
        packageName,
        appRecoveryId: String(appRecoveryId),
      });
      return res.data;
    });
  }

  async cancel(
    packageName: string,
    appRecoveryId: string | number,
  ): Promise<AppRecoveryAction> {
    assertPackageName(packageName);
    this.client.assertWritable("appRecovery.cancel");
    return this.client.request(async () => {
      const res = await this.client.publisher.apprecovery.cancel({
        packageName,
        appRecoveryId: String(appRecoveryId),
      });
      return res.data;
    });
  }

  async addTargeting(
    packageName: string,
    appRecoveryId: string | number,
    body: androidpublisher_v3.Schema$AddTargetingRequest,
  ): Promise<AppRecoveryAction> {
    assertPackageName(packageName);
    this.client.assertWritable("appRecovery.addTargeting");
    return this.client.request(async () => {
      const res = await this.client.publisher.apprecovery.addTargeting({
        packageName,
        appRecoveryId: String(appRecoveryId),
        requestBody: body,
      });
      return res.data;
    });
  }
}
