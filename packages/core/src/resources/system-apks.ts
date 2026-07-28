import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type Variant = androidpublisher_v3.Schema$Variant;

export class SystemApksApi {
  constructor(private readonly client: PlayStoreClient) {}

  async list(packageName: string, versionCode: number): Promise<Variant[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.systemapks.variants.list({
        packageName,
        versionCode: String(versionCode),
      });
      return res.data.variants ?? [];
    });
  }

  async get(
    packageName: string,
    versionCode: number,
    variantId: number,
  ): Promise<Variant> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.systemapks.variants.get({
        packageName,
        versionCode: String(versionCode),
        variantId,
      });
      return res.data;
    });
  }

  async create(
    packageName: string,
    versionCode: number,
    body: Variant,
  ): Promise<Variant> {
    assertPackageName(packageName);
    this.client.assertWritable("systemApks.create");
    return this.client.request(async () => {
      const res = await this.client.publisher.systemapks.variants.create({
        packageName,
        versionCode: String(versionCode),
        requestBody: body,
      });
      return res.data;
    });
  }

  async download(
    packageName: string,
    versionCode: number,
    variantId: number,
    outputPath: string,
  ): Promise<{ outputPath: string }> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.systemapks.variants.download(
        {
          packageName,
          versionCode: String(versionCode),
          variantId,
          alt: "media",
        },
        { responseType: "stream" },
      );
      const stream = res.data as unknown as NodeJS.ReadableStream;
      await pipeline(stream, createWriteStream(outputPath));
      return { outputPath };
    });
  }
}
