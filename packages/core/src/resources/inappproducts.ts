import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type InAppProduct = androidpublisher_v3.Schema$InAppProduct;

export class InAppProductsApi {
  constructor(private readonly client: PlayStoreClient) {}

  async list(
    packageName: string,
    options: { token?: string; startIndex?: number; maxResults?: number } = {},
  ): Promise<{
    inappproduct: InAppProduct[];
    tokenPagination?: androidpublisher_v3.Schema$TokenPagination;
  }> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.inappproducts.list({
        packageName,
        token: options.token,
        startIndex: options.startIndex,
        maxResults: options.maxResults,
      });
      return {
        inappproduct: res.data.inappproduct ?? [],
        tokenPagination: res.data.tokenPagination ?? undefined,
      };
    });
  }

  async get(packageName: string, sku: string): Promise<InAppProduct> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.inappproducts.get({ packageName, sku });
      return res.data;
    });
  }

  async insert(packageName: string, body: InAppProduct): Promise<InAppProduct> {
    assertPackageName(packageName);
    this.client.assertWritable("inappproducts.insert");
    return this.client.request(async () => {
      const res = await this.client.publisher.inappproducts.insert({
        packageName,
        requestBody: body,
      });
      return res.data;
    });
  }

  async update(
    packageName: string,
    sku: string,
    body: InAppProduct,
    options: { autoConvertMissingPrices?: boolean; allowMissing?: boolean } = {},
  ): Promise<InAppProduct> {
    assertPackageName(packageName);
    this.client.assertWritable("inappproducts.update");
    return this.client.request(async () => {
      const res = await this.client.publisher.inappproducts.update({
        packageName,
        sku,
        autoConvertMissingPrices: options.autoConvertMissingPrices,
        allowMissing: options.allowMissing,
        requestBody: body,
      });
      return res.data;
    });
  }

  async patch(
    packageName: string,
    sku: string,
    body: InAppProduct,
    options: { autoConvertMissingPrices?: boolean } = {},
  ): Promise<InAppProduct> {
    assertPackageName(packageName);
    this.client.assertWritable("inappproducts.patch");
    return this.client.request(async () => {
      const res = await this.client.publisher.inappproducts.patch({
        packageName,
        sku,
        autoConvertMissingPrices: options.autoConvertMissingPrices,
        requestBody: body,
      });
      return res.data;
    });
  }

  async delete(packageName: string, sku: string): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("inappproducts.delete");
    await this.client.request(async () => {
      await this.client.publisher.inappproducts.delete({ packageName, sku });
    });
  }

  async batchGet(packageName: string, sku: string[]): Promise<InAppProduct[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.inappproducts.batchGet({
        packageName,
        sku,
      });
      return res.data.inappproduct ?? [];
    });
  }

  async batchUpdate(
    packageName: string,
    requests: androidpublisher_v3.Schema$InAppProduct[],
    options: { autoConvertMissingPrices?: boolean } = {},
  ): Promise<InAppProduct[]> {
    assertPackageName(packageName);
    this.client.assertWritable("inappproducts.batchUpdate");
    return this.client.request(async () => {
      const res = await this.client.publisher.inappproducts.batchUpdate({
        packageName,
        requestBody: {
          requests: requests.map((inappproduct) => ({
            inappproduct,
            autoConvertMissingPrices: options.autoConvertMissingPrices,
          })) as androidpublisher_v3.Schema$InappproductsUpdateRequest[],
        },
      });
      return res.data.inappproducts ?? [];
    });
  }

  async batchDelete(packageName: string, skus: string[]): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("inappproducts.batchDelete");
    await this.client.request(async () => {
      await this.client.publisher.inappproducts.batchDelete({
        packageName,
        requestBody: {
          requests: skus.map((sku) => ({ packageName, sku })),
        },
      });
    });
  }
}
