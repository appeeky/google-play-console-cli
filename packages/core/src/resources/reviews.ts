import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type Review = androidpublisher_v3.Schema$Review;
export type ReviewsReplyResponse = androidpublisher_v3.Schema$ReviewsReplyResponse;

export class ReviewsApi {
  constructor(private readonly client: PlayStoreClient) {}

  async list(
    packageName: string,
    options: {
      token?: string;
      startIndex?: number;
      maxResults?: number;
      translationLanguage?: string;
    } = {},
  ): Promise<{ reviews: Review[]; tokenPagination?: androidpublisher_v3.Schema$TokenPagination }> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.reviews.list({
        packageName,
        token: options.token,
        startIndex: options.startIndex,
        maxResults: options.maxResults,
        translationLanguage: options.translationLanguage,
      });
      return {
        reviews: res.data.reviews ?? [],
        tokenPagination: res.data.tokenPagination ?? undefined,
      };
    });
  }

  async get(
    packageName: string,
    reviewId: string,
    options: { translationLanguage?: string } = {},
  ): Promise<Review> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.reviews.get({
        packageName,
        reviewId,
        translationLanguage: options.translationLanguage,
      });
      return res.data;
    });
  }

  async reply(
    packageName: string,
    reviewId: string,
    replyText: string,
  ): Promise<ReviewsReplyResponse> {
    assertPackageName(packageName);
    this.client.assertWritable("reviews.reply");
    return this.client.request(async () => {
      const res = await this.client.publisher.reviews.reply({
        packageName,
        reviewId,
        requestBody: { replyText },
      });
      return res.data;
    });
  }
}
