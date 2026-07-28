import { createReadStream } from "node:fs";
import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { ValidationError } from "../errors.js";
import { assertPackageName, validateListingText } from "../validation.js";

export type Listing = androidpublisher_v3.Schema$Listing;
export type Image = androidpublisher_v3.Schema$Image;

export type ImageType =
  | "featureGraphic"
  | "icon"
  | "phoneScreenshots"
  | "sevenInchScreenshots"
  | "tenInchScreenshots"
  | "tvBanner"
  | "tvScreenshots"
  | "wearScreenshots";

export class ListingsApi {
  constructor(private readonly client: PlayStoreClient) {}

  async list(packageName: string, editId: string): Promise<Listing[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.listings.list({
        packageName,
        editId,
      });
      return res.data.listings ?? [];
    });
  }

  async get(
    packageName: string,
    editId: string,
    language: string,
  ): Promise<Listing> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.listings.get({
        packageName,
        editId,
        language,
      });
      return res.data;
    });
  }

  async update(
    packageName: string,
    editId: string,
    language: string,
    body: Listing,
  ): Promise<Listing> {
    assertPackageName(packageName);
    this.client.assertWritable("listings.update");
    const errors = validateListingText({
      title: body.title ?? undefined,
      shortDescription: body.shortDescription ?? undefined,
      fullDescription: body.fullDescription ?? undefined,
    });
    if (errors.length > 0) {
      throw new ValidationError(errors.join("; "), errors);
    }
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.listings.update({
        packageName,
        editId,
        language,
        requestBody: body,
      });
      return res.data;
    });
  }

  async patch(
    packageName: string,
    editId: string,
    language: string,
    body: Listing,
  ): Promise<Listing> {
    assertPackageName(packageName);
    this.client.assertWritable("listings.patch");
    const errors = validateListingText({
      title: body.title ?? undefined,
      shortDescription: body.shortDescription ?? undefined,
      fullDescription: body.fullDescription ?? undefined,
    });
    if (errors.length > 0) {
      throw new ValidationError(errors.join("; "), errors);
    }
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.listings.patch({
        packageName,
        editId,
        language,
        requestBody: body,
      });
      return res.data;
    });
  }

  async delete(packageName: string, editId: string, language: string): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("listings.delete");
    await this.client.request(async () => {
      await this.client.publisher.edits.listings.delete({
        packageName,
        editId,
        language,
      });
    });
  }

  async deleteAll(packageName: string, editId: string): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("listings.deleteAll");
    await this.client.request(async () => {
      await this.client.publisher.edits.listings.deleteall({
        packageName,
        editId,
      });
    });
  }

  /** Convenience: patch listing inside an auto-committed edit */
  async updateListing(
    packageName: string,
    language: string,
    body: Listing,
    options: { validateOnly?: boolean } = {},
  ): Promise<Listing> {
    return this.client.edits
      .withEdit(
        packageName,
        async (editId) => this.patch(packageName, editId, language, body),
        { validateOnly: options.validateOnly },
      )
      .then((r) => r.result);
  }

  async listAllListings(packageName: string): Promise<Listing[]> {
    return this.client.edits.withEphemeralEdit(packageName, async (editId) =>
      this.list(packageName, editId),
    );
  }

  async listImages(
    packageName: string,
    editId: string,
    language: string,
    imageType: ImageType,
  ): Promise<Image[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.images.list({
        packageName,
        editId,
        language,
        imageType,
      });
      return res.data.images ?? [];
    });
  }

  async uploadImage(
    packageName: string,
    editId: string,
    language: string,
    imageType: ImageType,
    filePath: string,
  ): Promise<Image> {
    assertPackageName(packageName);
    this.client.assertWritable("listings.uploadImage");
    return this.client.request(async () => {
      const res = await this.client.publisher.edits.images.upload({
        packageName,
        editId,
        language,
        imageType,
        media: {
          mimeType: "image/png",
          body: createReadStream(filePath),
        },
      });
      return res.data.image ?? {};
    });
  }

  async deleteImage(
    packageName: string,
    editId: string,
    language: string,
    imageType: ImageType,
    imageId: string,
  ): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("listings.deleteImage");
    await this.client.request(async () => {
      await this.client.publisher.edits.images.delete({
        packageName,
        editId,
        language,
        imageType,
        imageId,
      });
    });
  }

  async deleteAllImages(
    packageName: string,
    editId: string,
    language: string,
    imageType: ImageType,
  ): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("listings.deleteAllImages");
    await this.client.request(async () => {
      await this.client.publisher.edits.images.deleteall({
        packageName,
        editId,
        language,
        imageType,
      });
    });
  }
}
