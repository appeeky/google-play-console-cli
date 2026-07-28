import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName, assertTrack } from "../validation.js";

export interface DeployOptions {
  track: string;
  /** Path to .aab or .apk */
  filePath: string;
  releaseNotes?: Array<{ language: string; text: string }>;
  /** 0 < fraction < 1 for staged rollout; omit or 1 for full */
  userFraction?: number;
  status?: "draft" | "inProgress" | "halted" | "completed";
  validateOnly?: boolean;
  changesNotSentForReview?: boolean;
  ackBundleInstallationWarning?: boolean;
}

export interface DeployResult {
  versionCode?: number | string | null;
  track: androidpublisher_v3.Schema$Track;
  artifactType: "bundle" | "apk";
}

export class DeployApi {
  constructor(private readonly client: PlayStoreClient) {}

  async deploy(packageName: string, options: DeployOptions): Promise<DeployResult> {
    assertPackageName(packageName);
    assertTrack(options.track);
    this.client.assertWritable("deploy");

    const lower = options.filePath.toLowerCase();
    const isBundle = lower.endsWith(".aab");
    const isApk = lower.endsWith(".apk");
    if (!isBundle && !isApk) {
      throw new Error("filePath must end with .aab or .apk");
    }

    return this.client.edits
      .withEdit(
        packageName,
        async (editId) => {
          let versionCode: number | string | null | undefined;
          if (isBundle) {
            const bundle = await this.client.artifacts.uploadBundle(
              packageName,
              editId,
              options.filePath,
              { ackBundleInstallationWarning: options.ackBundleInstallationWarning },
            );
            versionCode = bundle.versionCode;
          } else {
            const apk = await this.client.artifacts.uploadApk(
              packageName,
              editId,
              options.filePath,
            );
            versionCode = apk.versionCode;
          }

          const userFraction = options.userFraction;
          let status = options.status;
          if (!status) {
            status =
              userFraction !== undefined && userFraction < 1
                ? "inProgress"
                : "completed";
          }

          const track = await this.client.tracks.update(
            packageName,
            editId,
            options.track,
            {
              track: options.track,
              releases: [
                {
                  versionCodes: versionCode != null ? [String(versionCode)] : undefined,
                  status,
                  userFraction,
                  releaseNotes: options.releaseNotes?.map((n) => ({
                    language: n.language,
                    text: n.text,
                  })),
                },
              ],
            },
          );

          return {
            versionCode,
            track,
            artifactType: isBundle ? ("bundle" as const) : ("apk" as const),
          };
        },
        {
          validateOnly: options.validateOnly,
          changesNotSentForReview: options.changesNotSentForReview,
        },
      )
      .then((r) => r.result);
  }
}
