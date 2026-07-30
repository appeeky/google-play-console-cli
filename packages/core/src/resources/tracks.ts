import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName, assertTrack } from "../validation.js";

export type Track = androidpublisher_v3.Schema$Track;
export type TrackRelease = androidpublisher_v3.Schema$TrackRelease;
export type ReleaseSummary = androidpublisher_v3.Schema$ReleaseSummary;

export interface ListReleaseSummariesOptions {
  versionCode?: number | string;
}

export class TracksApi {
  constructor(private readonly client: PlayStoreClient) {}

  async list(packageName: string, editId: string): Promise<Track[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.tracks.list({
        packageName,
        editId,
      });
      return res.data.tracks ?? [];
    });
  }

  async get(packageName: string, editId: string, track: string): Promise<Track> {
    assertPackageName(packageName);
    assertTrack(track);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.tracks.get({
        packageName,
        editId,
        track,
      });
      return res.data;
    });
  }

  async update(
    packageName: string,
    editId: string,
    track: string,
    body: Track,
  ): Promise<Track> {
    assertPackageName(packageName);
    assertTrack(track);
    this.client.assertWritable("tracks.update");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.tracks.update({
        packageName,
        editId,
        track,
        requestBody: body,
      });
      return res.data;
    });
  }

  async patch(
    packageName: string,
    editId: string,
    track: string,
    body: Track,
  ): Promise<Track> {
    assertPackageName(packageName);
    assertTrack(track);
    this.client.assertWritable("tracks.patch");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.tracks.patch({
        packageName,
        editId,
        track,
        requestBody: body,
      });
      return res.data;
    });
  }

  async create(
    packageName: string,
    editId: string,
    body: Track,
  ): Promise<Track> {
    assertPackageName(packageName);
    this.client.assertWritable("tracks.create");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.tracks.create({
        packageName,
        editId,
        requestBody: body,
      });
      return res.data;
    });
  }

  async listReleases(packageName: string, track: string): Promise<TrackRelease[]> {
    assertPackageName(packageName);
    assertTrack(track);
    return this.client.edits.withEphemeralEdit(packageName, async (editId) => {
      const current = await this.get(packageName, editId, track);
      return current.releases ?? [];
    });
  }

  async listReleaseSummaries(
    packageName: string,
    track: string,
    options: ListReleaseSummariesOptions = {},
  ): Promise<ReleaseSummary[]> {
    assertPackageName(packageName);
    assertTrack(track);
    return this.client.request(async () => {
      const res = await this.client.publisher.applications.tracks.releases.list({
        parent: `applications/${packageName}/tracks/${track}`,
      });
      const releases = res.data.releases ?? [];
      if (options.versionCode === undefined) return releases;

      const versionCode = String(options.versionCode);
      return releases.filter((release) =>
        release.activeArtifacts?.some(
          (artifact) => String(artifact.versionCode) === versionCode,
        ),
      );
    });
  }

  /** Convenience: open ephemeral edit, list tracks, discard edit */
  async listCommitted(packageName: string): Promise<Track[]> {
    return this.client.edits.withEphemeralEdit(packageName, async (editId) => {
      return this.list(packageName, editId);
    });
  }

  async updateRollout(
    packageName: string,
    track: string,
    userFraction: number,
    options: { validateOnly?: boolean } = {},
  ): Promise<Track> {
    return this.client.edits
      .withEdit(
        packageName,
        async (editId) => {
          const current = await this.get(packageName, editId, track);
          const releases = (current.releases ?? []).map((release) => {
            if (release.status === "inProgress" || release.status === "halted") {
              return {
                ...release,
                status: "inProgress" as const,
                userFraction,
              };
            }
            return release;
          });
          return this.update(packageName, editId, track, {
            track,
            releases,
          });
        },
        { validateOnly: options.validateOnly },
      )
      .then((r) => r.result);
  }

  async haltRelease(
    packageName: string,
    track: string,
    options: { validateOnly?: boolean } = {},
  ): Promise<Track> {
    return this.client.edits
      .withEdit(
        packageName,
        async (editId) => {
          const current = await this.get(packageName, editId, track);
          const releases = (current.releases ?? []).map((release) => {
            if (release.status === "inProgress") {
              return { ...release, status: "halted" as const };
            }
            return release;
          });
          return this.update(packageName, editId, track, { track, releases });
        },
        { validateOnly: options.validateOnly },
      )
      .then((r) => r.result);
  }

  async promoteRelease(
    packageName: string,
    fromTrack: string,
    toTrack: string,
    options: { userFraction?: number; validateOnly?: boolean } = {},
  ): Promise<Track> {
    return this.client.edits
      .withEdit(
        packageName,
        async (editId) => {
          const source = await this.get(packageName, editId, fromTrack);
          const release = source.releases?.[0];
          if (!release) {
            throw new Error(`No release found on track ${fromTrack}`);
          }
          const status =
            options.userFraction !== undefined && options.userFraction < 1
              ? ("inProgress" as const)
              : ("completed" as const);
          return this.update(packageName, editId, toTrack, {
            track: toTrack,
            releases: [
              {
                versionCodes: release.versionCodes,
                status,
                userFraction: options.userFraction,
                releaseNotes: release.releaseNotes,
              },
            ],
          });
        },
        { validateOnly: options.validateOnly },
      )
      .then((r) => r.result);
  }
}
