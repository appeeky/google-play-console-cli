import { createReadStream } from "node:fs";
import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type InternalAppSharingArtifact =
  androidpublisher_v3.Schema$InternalAppSharingArtifact;

export class InternalSharingApi {
  constructor(private readonly client: PlayStoreClient) {}

  async uploadApk(
    packageName: string,
    filePath: string,
  ): Promise<InternalAppSharingArtifact> {
    assertPackageName(packageName);
    this.client.assertWritable("internalSharing.uploadApk");
    return this.client.request(async () => {
      const res = await this.client.publisher.internalappsharingartifacts.uploadapk({
        packageName,
        media: {
          mimeType: "application/vnd.android.package-archive",
          body: createReadStream(filePath),
        },
      });
      return res.data;
    });
  }

  async uploadBundle(
    packageName: string,
    filePath: string,
  ): Promise<InternalAppSharingArtifact> {
    assertPackageName(packageName);
    this.client.assertWritable("internalSharing.uploadBundle");
    return this.client.request(async () => {
      const res = await this.client.publisher.internalappsharingartifacts.uploadbundle({
        packageName,
        media: {
          mimeType: "application/octet-stream",
          body: createReadStream(filePath),
        },
      });
      return res.data;
    });
  }
}
