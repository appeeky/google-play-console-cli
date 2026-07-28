import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type AppEdit = androidpublisher_v3.Schema$AppEdit;

export interface EditSessionResult<T> {
  editId: string;
  result: T;
  committed: boolean;
}

export class EditsApi {
  constructor(private readonly client: PlayStoreClient) {}

  async insert(packageName: string): Promise<AppEdit> {
    assertPackageName(packageName);
    this.client.assertWritable("edits.insert");
    return this.insertUnchecked(packageName);
  }

  private async insertUnchecked(packageName: string): Promise<AppEdit> {
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.insert({ packageName });
      return res.data;
    });
  }

  async get(packageName: string, editId: string): Promise<AppEdit> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.get({ packageName, editId });
      return res.data;
    });
  }

  async validate(packageName: string, editId: string): Promise<AppEdit> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.validate({ packageName, editId });
      return res.data;
    });
  }

  async commit(
    packageName: string,
    editId: string,
    options: { changesNotSentForReview?: boolean } = {},
  ): Promise<AppEdit> {
    assertPackageName(packageName);
    this.client.assertWritable("edits.commit");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.commit({
        packageName,
        editId,
        changesNotSentForReview: options.changesNotSentForReview,
      });
      return res.data;
    });
  }

  async delete(packageName: string, editId: string): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("edits.delete");
    await this.deleteUnchecked(packageName, editId);
  }

  private async deleteUnchecked(packageName: string, editId: string): Promise<void> {
    await this.client.request(async () => {
      await this.client.publisher.edits.delete({ packageName, editId });
    });
  }

  /**
   * Open a temporary edit for reads, then delete it (no commit).
   * Allowed in read-only mode: the edit is discarded and never committed.
   * Still requires Play Console edit permission from Google.
   */
  async withEphemeralEdit<T>(
    packageName: string,
    fn: (editId: string) => Promise<T>,
  ): Promise<T> {
    assertPackageName(packageName);

    const edit = await this.insertUnchecked(packageName);
    const editId = edit.id;
    if (!editId) {
      throw new Error("Edit insert did not return an edit id");
    }

    try {
      return await fn(editId);
    } finally {
      try {
        await this.deleteUnchecked(packageName, editId);
      } catch {
        // best-effort cleanup
      }
    }
  }

  /**
   * Run mutations inside an edit session. Commits on success; deletes on failure.
   */
  async withEdit<T>(
    packageName: string,
    fn: (editId: string) => Promise<T>,
    options: { validateOnly?: boolean; changesNotSentForReview?: boolean } = {},
  ): Promise<EditSessionResult<T>> {
    assertPackageName(packageName);
    this.client.assertWritable("edits.withEdit");

    const edit = await this.insert(packageName);
    const editId = edit.id;
    if (!editId) {
      throw new Error("Edit insert did not return an edit id");
    }

    try {
      const result = await fn(editId);
      if (options.validateOnly) {
        await this.validate(packageName, editId);
        await this.delete(packageName, editId);
        return { editId, result, committed: false };
      }
      await this.commit(packageName, editId, {
        changesNotSentForReview: options.changesNotSentForReview,
      });
      return { editId, result, committed: true };
    } catch (error) {
      try {
        await this.delete(packageName, editId);
      } catch {
        // best-effort cleanup
      }
      throw error;
    }
  }
}
