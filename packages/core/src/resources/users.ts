import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";

export type User = androidpublisher_v3.Schema$User;
export type Grant = androidpublisher_v3.Schema$Grant;

export class UsersApi {
  constructor(private readonly client: PlayStoreClient) {}

  async list(
    developerId: string,
    options: { pageSize?: number; pageToken?: string } = {},
  ): Promise<{ users: User[]; nextPageToken?: string | null }> {
    return this.client.request(async () => {
      const res = await this.client.publisher.users.list({
        parent: `developers/${developerId}`,
        pageSize: options.pageSize,
        pageToken: options.pageToken,
      });
      return {
        users: res.data.users ?? [],
        nextPageToken: res.data.nextPageToken,
      };
    });
  }

  async create(developerId: string, body: User): Promise<User> {
    this.client.assertWritable("users.create");
    return this.client.request(async () => {
      const res = await this.client.publisher.users.create({
        parent: `developers/${developerId}`,
        requestBody: body,
      });
      return res.data;
    });
  }

  async patch(
    developerId: string,
    email: string,
    body: User,
    options: { updateMask?: string } = {},
  ): Promise<User> {
    this.client.assertWritable("users.patch");
    return this.client.request(async () => {
      const res = await this.client.publisher.users.patch({
        name: `developers/${developerId}/users/${email}`,
        updateMask: options.updateMask,
        requestBody: body,
      });
      return res.data;
    });
  }

  async delete(developerId: string, email: string): Promise<void> {
    this.client.assertWritable("users.delete");
    await this.client.request(async () => {
      await this.client.publisher.users.delete({
        name: `developers/${developerId}/users/${email}`,
      });
    });
  }

  async createGrant(
    developerId: string,
    email: string,
    body: Grant,
  ): Promise<Grant> {
    this.client.assertWritable("users.createGrant");
    return this.client.request(async () => {
      const res = await this.client.publisher.grants.create({
        parent: `developers/${developerId}/users/${email}`,
        requestBody: body,
      });
      return res.data;
    });
  }

  async patchGrant(
    developerId: string,
    email: string,
    packageName: string,
    body: Grant,
    options: { updateMask?: string } = {},
  ): Promise<Grant> {
    this.client.assertWritable("users.patchGrant");
    return this.client.request(async () => {
      const res = await this.client.publisher.grants.patch({
        name: `developers/${developerId}/users/${email}/grants/${packageName}`,
        updateMask: options.updateMask,
        requestBody: body,
      });
      return res.data;
    });
  }

  async deleteGrant(
    developerId: string,
    email: string,
    packageName: string,
  ): Promise<void> {
    this.client.assertWritable("users.deleteGrant");
    await this.client.request(async () => {
      await this.client.publisher.grants.delete({
        name: `developers/${developerId}/users/${email}/grants/${packageName}`,
      });
    });
  }
}
