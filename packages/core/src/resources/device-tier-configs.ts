import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type DeviceTierConfig = androidpublisher_v3.Schema$DeviceTierConfig;

export class DeviceTierConfigsApi {
  constructor(private readonly client: PlayStoreClient) {}

  async list(
    packageName: string,
    options: { pageSize?: number; pageToken?: string } = {},
  ): Promise<{
    deviceTierConfigs: DeviceTierConfig[];
    nextPageToken?: string | null;
  }> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.applications.deviceTierConfigs.list({
        packageName,
        pageSize: options.pageSize,
        pageToken: options.pageToken,
      });
      return {
        deviceTierConfigs: res.data.deviceTierConfigs ?? [],
        nextPageToken: res.data.nextPageToken,
      };
    });
  }

  async get(
    packageName: string,
    deviceTierConfigId: string,
  ): Promise<DeviceTierConfig> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.applications.deviceTierConfigs.get({
        packageName,
        deviceTierConfigId,
      });
      return res.data;
    });
  }

  async create(
    packageName: string,
    body: DeviceTierConfig,
    options: { allowUnknownDevices?: boolean } = {},
  ): Promise<DeviceTierConfig> {
    assertPackageName(packageName);
    this.client.assertWritable("deviceTierConfigs.create");
    return this.client.request(async () => {
      const res = await this.client.publisher.applications.deviceTierConfigs.create({
        packageName,
        allowUnknownDevices: options.allowUnknownDevices,
        requestBody: body,
      });
      return res.data;
    });
  }
}
