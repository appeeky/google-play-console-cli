import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type GeneratedApksPerSigningKey =
  androidpublisher_v3.Schema$GeneratedApksPerSigningKey;

export class GeneratedApksApi {
  constructor(private readonly client: PlayStoreClient) {}

  async list(
    packageName: string,
    versionCode: number,
  ): Promise<GeneratedApksPerSigningKey[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.generatedapks.list({
        packageName,
        versionCode,
      });
      return res.data.generatedApks ?? [];
    });
  }

  async download(
    packageName: string,
    versionCode: number,
    downloadId: string,
    outputPath: string,
  ): Promise<{ outputPath: string }> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.generatedapks.download(
        {
          packageName,
          versionCode,
          downloadId,
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
