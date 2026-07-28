import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type ProductPurchase = androidpublisher_v3.Schema$ProductPurchase;
export type ProductPurchaseV2 = androidpublisher_v3.Schema$ProductPurchaseV2;
export type SubscriptionPurchaseV2 = androidpublisher_v3.Schema$SubscriptionPurchaseV2;
export type VoidedPurchase = androidpublisher_v3.Schema$VoidedPurchase;

export class PurchasesApi {
  constructor(private readonly client: PlayStoreClient) {}

  async getProductPurchase(
    packageName: string,
    productId: string,
    token: string,
  ): Promise<ProductPurchase> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.purchases.products.get({
        packageName,
        productId,
        token,
      });
      return res.data;
    });
  }

  async getProductPurchaseV2(
    packageName: string,
    token: string,
  ): Promise<ProductPurchaseV2> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.purchases.productsv2.getproductpurchasev2({
        packageName,
        token,
      });
      return res.data;
    });
  }

  async acknowledgeProductPurchase(
    packageName: string,
    productId: string,
    token: string,
    developerPayload?: string,
  ): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("purchases.acknowledgeProduct");
    await this.client.request(async () => {
      await this.client.publisher.purchases.products.acknowledge({
        packageName,
        productId,
        token,
        requestBody: developerPayload ? { developerPayload } : {},
      });
    });
  }

  async consumeProductPurchase(
    packageName: string,
    productId: string,
    token: string,
  ): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("purchases.consumeProduct");
    await this.client.request(async () => {
      await this.client.publisher.purchases.products.consume({
        packageName,
        productId,
        token,
      });
    });
  }

  async getSubscriptionPurchaseV2(
    packageName: string,
    token: string,
  ): Promise<SubscriptionPurchaseV2> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.purchases.subscriptionsv2.get({
        packageName,
        token,
      });
      return res.data;
    });
  }

  async cancelSubscription(
    packageName: string,
    token: string,
    body: androidpublisher_v3.Schema$CancelSubscriptionPurchaseRequest = {},
  ): Promise<androidpublisher_v3.Schema$CancelSubscriptionPurchaseResponse> {
    assertPackageName(packageName);
    this.client.assertWritable("purchases.cancelSubscription");
    return this.client.request(async () => {
      const res = await this.client.publisher.purchases.subscriptionsv2.cancel({
        packageName,
        token,
        requestBody: body,
      });
      return res.data;
    });
  }

  async deferSubscription(
    packageName: string,
    token: string,
    body: androidpublisher_v3.Schema$DeferSubscriptionPurchaseRequest,
  ): Promise<androidpublisher_v3.Schema$DeferSubscriptionPurchaseResponse> {
    assertPackageName(packageName);
    this.client.assertWritable("purchases.deferSubscription");
    return this.client.request(async () => {
      const res = await this.client.publisher.purchases.subscriptionsv2.defer({
        packageName,
        token,
        requestBody: body,
      });
      return res.data;
    });
  }

  async revokeSubscription(
    packageName: string,
    token: string,
    body: androidpublisher_v3.Schema$RevokeSubscriptionPurchaseRequest = {},
  ): Promise<androidpublisher_v3.Schema$RevokeSubscriptionPurchaseResponse> {
    assertPackageName(packageName);
    this.client.assertWritable("purchases.revokeSubscription");
    return this.client.request(async () => {
      const res = await this.client.publisher.purchases.subscriptionsv2.revoke({
        packageName,
        token,
        requestBody: body,
      });
      return res.data;
    });
  }

  async acknowledgeSubscription(
    packageName: string,
    subscriptionId: string,
    token: string,
    developerPayload?: string,
  ): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("purchases.acknowledgeSubscription");
    await this.client.request(async () => {
      await this.client.publisher.purchases.subscriptions.acknowledge({
        packageName,
        subscriptionId,
        token,
        requestBody: developerPayload ? { developerPayload } : {},
      });
    });
  }

  async listVoidedPurchases(
    packageName: string,
    options: {
      startTime?: string;
      endTime?: string;
      maxResults?: number;
      token?: string;
      type?: number;
      includeQuantityBasedPartialRefund?: boolean;
    } = {},
  ): Promise<{
    voidedPurchases: VoidedPurchase[];
    tokenPagination?: androidpublisher_v3.Schema$TokenPagination;
  }> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.purchases.voidedpurchases.list({
        packageName,
        startTime: options.startTime,
        endTime: options.endTime,
        maxResults: options.maxResults,
        token: options.token,
        type: options.type,
        includeQuantityBasedPartialRefund: options.includeQuantityBasedPartialRefund,
      });
      return {
        voidedPurchases: res.data.voidedPurchases ?? [],
        tokenPagination: res.data.tokenPagination ?? undefined,
      };
    });
  }
}
