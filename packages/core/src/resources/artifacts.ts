import { createReadStream } from "node:fs";
import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type Apk = androidpublisher_v3.Schema$Apk;
export type Bundle = androidpublisher_v3.Schema$Bundle;
export type ExpansionFile = androidpublisher_v3.Schema$ExpansionFile;
export type DeobfuscationFilesUploadResponse =
  androidpublisher_v3.Schema$DeobfuscationFilesUploadResponse;

export class ArtifactsApi {
  constructor(private readonly client: PlayStoreClient) {}

  async listApks(packageName: string, editId: string): Promise<Apk[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.apks.list({ packageName, editId });
      return res.data.apks ?? [];
    });
  }

  async uploadApk(
    packageName: string,
    editId: string,
    filePath: string,
  ): Promise<Apk> {
    assertPackageName(packageName);
    this.client.assertWritable("artifacts.uploadApk");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.apks.upload({
        packageName,
        editId,
        media: {
          mimeType: "application/vnd.android.package-archive",
          body: createReadStream(filePath),
        },
      });
      return res.data;
    });
  }

  async addExternallyHostedApk(
    packageName: string,
    editId: string,
    externallyHostedApk: androidpublisher_v3.Schema$ExternallyHostedApk,
  ): Promise<androidpublisher_v3.Schema$ApksAddExternallyHostedResponse> {
    assertPackageName(packageName);
    this.client.assertWritable("artifacts.addExternallyHostedApk");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.apks.addexternallyhosted({
        packageName,
        editId,
        requestBody: { externallyHostedApk },
      });
      return res.data;
    });
  }

  async listBundles(packageName: string, editId: string): Promise<Bundle[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.bundles.list({ packageName, editId });
      return res.data.bundles ?? [];
    });
  }

  async uploadBundle(
    packageName: string,
    editId: string,
    filePath: string,
    options: { ackBundleInstallationWarning?: boolean } = {},
  ): Promise<Bundle> {
    assertPackageName(packageName);
    this.client.assertWritable("artifacts.uploadBundle");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.bundles.upload({
        packageName,
        editId,
        ackBundleInstallationWarning: options.ackBundleInstallationWarning,
        media: {
          mimeType: "application/octet-stream",
          body: createReadStream(filePath),
        },
      });
      return res.data;
    });
  }

  async uploadDeobfuscationFile(
    packageName: string,
    editId: string,
    apkVersionCode: number,
    deobfuscationFileType: "proguard" | "nativeCode",
    filePath: string,
  ): Promise<DeobfuscationFilesUploadResponse> {
    assertPackageName(packageName);
    this.client.assertWritable("artifacts.uploadDeobfuscationFile");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.deobfuscationfiles.upload({
        packageName,
        editId,
        apkVersionCode,
        deobfuscationFileType,
        media: {
          mimeType: "application/octet-stream",
          body: createReadStream(filePath),
        },
      });
      return res.data;
    });
  }

  async getExpansionFile(
    packageName: string,
    editId: string,
    apkVersionCode: number,
    expansionFileType: "main" | "patch",
  ): Promise<ExpansionFile> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.expansionfiles.get({
        packageName,
        editId,
        apkVersionCode,
        expansionFileType,
      });
      return res.data;
    });
  }

  async uploadExpansionFile(
    packageName: string,
    editId: string,
    apkVersionCode: number,
    expansionFileType: "main" | "patch",
    filePath: string,
  ): Promise<ExpansionFile> {
    assertPackageName(packageName);
    this.client.assertWritable("artifacts.uploadExpansionFile");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.expansionfiles.upload({
        packageName,
        editId,
        apkVersionCode,
        expansionFileType,
        media: {
          mimeType: "application/octet-stream",
          body: createReadStream(filePath),
        },
      });
      return res.data.expansionFile ?? {};
    });
  }

  async getDetails(packageName: string, editId: string) {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.details.get({ packageName, editId });
      return res.data;
    });
  }

  async patchDetails(
    packageName: string,
    editId: string,
    body: androidpublisher_v3.Schema$AppDetails,
  ) {
    assertPackageName(packageName);
    this.client.assertWritable("artifacts.patchDetails");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.details.patch({
        packageName,
        editId,
        requestBody: body,
      });
      return res.data;
    });
  }

  async getCountryAvailability(
    packageName: string,
    editId: string,
    track: string,
  ) {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.countryavailability.get({
        packageName,
        editId,
        track,
      });
      return res.data;
    });
  }
}
