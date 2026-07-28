import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName, assertTrack } from "../validation.js";

export type Testers = androidpublisher_v3.Schema$Testers;

export class TestersApi {
  constructor(private readonly client: PlayStoreClient) {}

  async get(packageName: string, editId: string, track: string): Promise<Testers> {
    assertPackageName(packageName);
    assertTrack(track);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.testers.get({
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
    body: Testers,
  ): Promise<Testers> {
    assertPackageName(packageName);
    assertTrack(track);
    this.client.assertWritable("testers.update");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.testers.update({
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
    body: Testers,
  ): Promise<Testers> {
    assertPackageName(packageName);
    assertTrack(track);
    this.client.assertWritable("testers.patch");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.testers.patch({
        packageName,
        editId,
        track,
        requestBody: body,
      });
      return res.data;
    });
  }

  async updateTesters(
    packageName: string,
    track: string,
    body: Testers,
    options: { validateOnly?: boolean } = {},
  ): Promise<Testers> {
    return this.client.edits
      .withEdit(
        packageName,
        async (editId) => this.update(packageName, editId, track, body),
        { validateOnly: options.validateOnly },
      )
      .then((r) => r.result);
  }
}
