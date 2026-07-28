import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type Subscription = androidpublisher_v3.Schema$Subscription;
export type SubscriptionOffer = androidpublisher_v3.Schema$SubscriptionOffer;
export type OneTimeProduct = androidpublisher_v3.Schema$OneTimeProduct;
export type ConvertRegionPricesResponse =
  androidpublisher_v3.Schema$ConvertRegionPricesResponse;

export class MonetizationApi {
  constructor(private readonly client: PlayStoreClient) {}

  // ── Subscriptions ──────────────────────────────────────────────

  async listSubscriptions(
    packageName: string,
    options: { pageSize?: number; pageToken?: string; showArchived?: boolean } = {},
  ): Promise<{
    subscriptions: Subscription[];
    nextPageToken?: string | null;
  }> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.subscriptions.list({
        packageName,
        pageSize: options.pageSize,
        pageToken: options.pageToken,
        showArchived: options.showArchived,
      });
      return {
        subscriptions: res.data.subscriptions ?? [],
        nextPageToken: res.data.nextPageToken,
      };
    });
  }

  async getSubscription(packageName: string, productId: string): Promise<Subscription> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.subscriptions.get({
        packageName,
        productId,
      });
      return res.data;
    });
  }

  async createSubscription(
    packageName: string,
    productId: string,
    body: Subscription,
    options: { regionsVersion?: string } = {},
  ): Promise<Subscription> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.createSubscription");
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.subscriptions.create({
        packageName,
        productId,
        "regionsVersion.version": options.regionsVersion,
        requestBody: body,
      });
      return res.data;
    });
  }

  async patchSubscription(
    packageName: string,
    productId: string,
    body: Subscription,
    options: { updateMask?: string; regionsVersion?: string; allowMissing?: boolean } = {},
  ): Promise<Subscription> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.patchSubscription");
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.subscriptions.patch({
        packageName,
        productId,
        updateMask: options.updateMask,
        allowMissing: options.allowMissing,
        "regionsVersion.version": options.regionsVersion,
        requestBody: body,
      });
      return res.data;
    });
  }

  async deleteSubscription(packageName: string, productId: string): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.deleteSubscription");
    await this.client.request(async () => {
      await this.client.publisher.monetization.subscriptions.delete({
        packageName,
        productId,
      });
    });
  }

  async batchGetSubscriptions(
    packageName: string,
    productIds: string[],
  ): Promise<Subscription[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.subscriptions.batchGet({
        packageName,
        productIds,
      });
      return res.data.subscriptions ?? [];
    });
  }

  async batchUpdateSubscriptions(
    packageName: string,
    requests: androidpublisher_v3.Schema$UpdateSubscriptionRequest[],
    _options: { regionsVersion?: string } = {},
  ): Promise<Subscription[]> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchUpdateSubscriptions");
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.subscriptions.batchUpdate({
        packageName,
        requestBody: {
          requests,
        },
      });
      return res.data.subscriptions ?? [];
    });
  }

  // ── Base plans ─────────────────────────────────────────────────

  async activateBasePlan(
    packageName: string,
    productId: string,
    basePlanId: string,
  ): Promise<Subscription> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.activateBasePlan");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.activate({
          packageName,
          productId,
          basePlanId,
        });
      return res.data;
    });
  }

  async deactivateBasePlan(
    packageName: string,
    productId: string,
    basePlanId: string,
  ): Promise<Subscription> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.deactivateBasePlan");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.deactivate({
          packageName,
          productId,
          basePlanId,
        });
      return res.data;
    });
  }

  async deleteBasePlan(
    packageName: string,
    productId: string,
    basePlanId: string,
  ): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.deleteBasePlan");
    await this.client.request(async () => {
      await this.client.publisher.monetization.subscriptions.basePlans.delete({
        packageName,
        productId,
        basePlanId,
      });
    });
  }

  async migrateBasePlanPrices(
    packageName: string,
    productId: string,
    basePlanId: string,
    options: { regionsVersion?: string; regionalPriceMigrations?: androidpublisher_v3.Schema$RegionalPriceMigrationConfig[] } = {},
  ): Promise<Subscription> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.migrateBasePlanPrices");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.migratePrices({
          packageName,
          productId,
          basePlanId,
          requestBody: {
            packageName,
            productId,
            basePlanId,
            regionalPriceMigrations: options.regionalPriceMigrations,
            regionsVersion: options.regionsVersion
              ? { version: options.regionsVersion }
              : undefined,
          },
        });
      return res.data;
    });
  }

  async batchUpdateBasePlanStates(
    packageName: string,
    productId: string,
    requests: androidpublisher_v3.Schema$UpdateBasePlanStateRequest[],
  ): Promise<Subscription[]> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchUpdateBasePlanStates");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.batchUpdateStates(
          {
            packageName,
            productId,
            requestBody: { requests },
          },
        );
      return res.data.subscriptions ?? [];
    });
  }

  async batchMigrateBasePlanPrices(
    packageName: string,
    productId: string,
    requests: androidpublisher_v3.Schema$MigrateBasePlanPricesRequest[],
  ): Promise<androidpublisher_v3.Schema$BatchMigrateBasePlanPricesResponse> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchMigrateBasePlanPrices");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.batchMigratePrices(
          {
            packageName,
            productId,
            requestBody: { requests },
          },
        );
      return res.data;
    });
  }

  // ── Subscription offers ────────────────────────────────────────

  async listSubscriptionOffers(
    packageName: string,
    productId: string,
    basePlanId: string,
    options: { pageSize?: number; pageToken?: string } = {},
  ): Promise<{ subscriptionOffers: SubscriptionOffer[]; nextPageToken?: string | null }> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.offers.list({
          packageName,
          productId,
          basePlanId,
          pageSize: options.pageSize,
          pageToken: options.pageToken,
        });
      return {
        subscriptionOffers: res.data.subscriptionOffers ?? [],
        nextPageToken: res.data.nextPageToken,
      };
    });
  }

  async getSubscriptionOffer(
    packageName: string,
    productId: string,
    basePlanId: string,
    offerId: string,
  ): Promise<SubscriptionOffer> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.offers.get({
          packageName,
          productId,
          basePlanId,
          offerId,
        });
      return res.data;
    });
  }

  async createSubscriptionOffer(
    packageName: string,
    productId: string,
    basePlanId: string,
    offerId: string,
    body: SubscriptionOffer,
    options: { regionsVersion?: string } = {},
  ): Promise<SubscriptionOffer> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.createSubscriptionOffer");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.offers.create({
          packageName,
          productId,
          basePlanId,
          offerId,
          "regionsVersion.version": options.regionsVersion,
          requestBody: body,
        });
      return res.data;
    });
  }

  async patchSubscriptionOffer(
    packageName: string,
    productId: string,
    basePlanId: string,
    offerId: string,
    body: SubscriptionOffer,
    options: { updateMask?: string; regionsVersion?: string; allowMissing?: boolean } = {},
  ): Promise<SubscriptionOffer> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.patchSubscriptionOffer");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.offers.patch({
          packageName,
          productId,
          basePlanId,
          offerId,
          updateMask: options.updateMask,
          allowMissing: options.allowMissing,
          "regionsVersion.version": options.regionsVersion,
          requestBody: body,
        });
      return res.data;
    });
  }

  async activateSubscriptionOffer(
    packageName: string,
    productId: string,
    basePlanId: string,
    offerId: string,
  ): Promise<SubscriptionOffer> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.activateSubscriptionOffer");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.offers.activate({
          packageName,
          productId,
          basePlanId,
          offerId,
        });
      return res.data;
    });
  }

  async deactivateSubscriptionOffer(
    packageName: string,
    productId: string,
    basePlanId: string,
    offerId: string,
  ): Promise<SubscriptionOffer> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.deactivateSubscriptionOffer");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.offers.deactivate({
          packageName,
          productId,
          basePlanId,
          offerId,
        });
      return res.data;
    });
  }

  async deleteSubscriptionOffer(
    packageName: string,
    productId: string,
    basePlanId: string,
    offerId: string,
  ): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.deleteSubscriptionOffer");
    await this.client.request(async () => {
      await this.client.publisher.monetization.subscriptions.basePlans.offers.delete({
        packageName,
        productId,
        basePlanId,
        offerId,
      });
    });
  }

  async batchGetSubscriptionOffers(
    packageName: string,
    productId: string,
    basePlanId: string,
    offerIds: string[],
  ): Promise<SubscriptionOffer[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.offers.batchGet({
          packageName,
          productId,
          basePlanId,
          requestBody: {
            requests: offerIds.map((offerId) => ({
              packageName,
              productId,
              basePlanId,
              offerId,
            })),
          },
        });
      return res.data.subscriptionOffers ?? [];
    });
  }

  async batchUpdateSubscriptionOffers(
    packageName: string,
    productId: string,
    basePlanId: string,
    requests: androidpublisher_v3.Schema$UpdateSubscriptionOfferRequest[],
  ): Promise<SubscriptionOffer[]> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchUpdateSubscriptionOffers");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.offers.batchUpdate(
          {
            packageName,
            productId,
            basePlanId,
            requestBody: { requests },
          },
        );
      return res.data.subscriptionOffers ?? [];
    });
  }

  async batchUpdateSubscriptionOfferStates(
    packageName: string,
    productId: string,
    basePlanId: string,
    requests: androidpublisher_v3.Schema$UpdateSubscriptionOfferStateRequest[],
  ): Promise<SubscriptionOffer[]> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchUpdateSubscriptionOfferStates");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.subscriptions.basePlans.offers.batchUpdateStates(
          {
            packageName,
            productId,
            basePlanId,
            requestBody: { requests },
          },
        );
      return res.data.subscriptionOffers ?? [];
    });
  }

  // ── One-time products ──────────────────────────────────────────

  async listOneTimeProducts(
    packageName: string,
    options: { pageSize?: number; pageToken?: string } = {},
  ): Promise<{ oneTimeProducts: OneTimeProduct[]; nextPageToken?: string | null }> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.onetimeproducts.list({
        packageName,
        pageSize: options.pageSize,
        pageToken: options.pageToken,
      });
      return {
        oneTimeProducts: res.data.oneTimeProducts ?? [],
        nextPageToken: res.data.nextPageToken,
      };
    });
  }

  async getOneTimeProduct(
    packageName: string,
    productId: string,
  ): Promise<OneTimeProduct> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.onetimeproducts.get({
        packageName,
        productId,
      });
      return res.data;
    });
  }

  async patchOneTimeProduct(
    packageName: string,
    productId: string,
    body: OneTimeProduct,
    options: { updateMask?: string; regionsVersion?: string; allowMissing?: boolean } = {},
  ): Promise<OneTimeProduct> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.patchOneTimeProduct");
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.onetimeproducts.patch({
        packageName,
        productId,
        updateMask: options.updateMask,
        allowMissing: options.allowMissing,
        "regionsVersion.version": options.regionsVersion,
        requestBody: body,
      });
      return res.data;
    });
  }

  async deleteOneTimeProduct(packageName: string, productId: string): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.deleteOneTimeProduct");
    await this.client.request(async () => {
      await this.client.publisher.monetization.onetimeproducts.delete({
        packageName,
        productId,
      });
    });
  }

  async batchGetOneTimeProducts(
    packageName: string,
    productIds: string[],
  ): Promise<OneTimeProduct[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.onetimeproducts.batchGet({
        packageName,
        productIds,
      });
      return res.data.oneTimeProducts ?? [];
    });
  }

  async batchUpdateOneTimeProducts(
    packageName: string,
    requests: androidpublisher_v3.Schema$UpdateOneTimeProductRequest[],
    _options: { regionsVersion?: string } = {},
  ): Promise<OneTimeProduct[]> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchUpdateOneTimeProducts");
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.onetimeproducts.batchUpdate({
        packageName,
        requestBody: {
          requests,
        },
      });
      return res.data.oneTimeProducts ?? [];
    });
  }

  async batchDeleteOneTimeProducts(
    packageName: string,
    productIds: string[],
  ): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchDeleteOneTimeProducts");
    await this.client.request(async () => {
      await this.client.publisher.monetization.onetimeproducts.batchDelete({
        packageName,
        requestBody: {
          requests: productIds.map((productId) => ({ packageName, productId })),
        },
      });
    });
  }

  // ── Purchase option offers ─────────────────────────────────────

  async listPurchaseOptionOffers(
    packageName: string,
    productId: string,
    purchaseOptionId: string,
  ) {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.onetimeproducts.purchaseOptions.offers.list(
          {
            packageName,
            productId,
            purchaseOptionId,
          },
        );
      return res.data;
    });
  }

  async activatePurchaseOptionOffer(
    packageName: string,
    productId: string,
    purchaseOptionId: string,
    offerId: string,
  ) {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.activatePurchaseOptionOffer");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.onetimeproducts.purchaseOptions.offers.activate(
          {
            packageName,
            productId,
            purchaseOptionId,
            offerId,
          },
        );
      return res.data;
    });
  }

  async deactivatePurchaseOptionOffer(
    packageName: string,
    productId: string,
    purchaseOptionId: string,
    offerId: string,
  ) {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.deactivatePurchaseOptionOffer");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.onetimeproducts.purchaseOptions.offers.deactivate(
          {
            packageName,
            productId,
            purchaseOptionId,
            offerId,
          },
        );
      return res.data;
    });
  }

  async cancelPurchaseOptionOffer(
    packageName: string,
    productId: string,
    purchaseOptionId: string,
    offerId: string,
  ) {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.cancelPurchaseOptionOffer");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.onetimeproducts.purchaseOptions.offers.cancel(
          {
            packageName,
            productId,
            purchaseOptionId,
            offerId,
          },
        );
      return res.data;
    });
  }

  async batchDeletePurchaseOptions(
    packageName: string,
    productId: string,
    purchaseOptionIds: string[],
  ): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchDeletePurchaseOptions");
    await this.client.request(async () => {
      await this.client.publisher.monetization.onetimeproducts.purchaseOptions.batchDelete(
        {
          packageName,
          productId,
          requestBody: {
            requests: purchaseOptionIds.map((purchaseOptionId) => ({
              packageName,
              productId,
              purchaseOptionId,
            })),
          },
        },
      );
    });
  }

  async batchUpdatePurchaseOptionStates(
    packageName: string,
    productId: string,
    requests: androidpublisher_v3.Schema$UpdatePurchaseOptionStateRequest[],
  ) {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchUpdatePurchaseOptionStates");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.onetimeproducts.purchaseOptions.batchUpdateStates(
          {
            packageName,
            productId,
            requestBody: { requests },
          },
        );
      return res.data;
    });
  }

  async batchGetPurchaseOptionOffers(
    packageName: string,
    productId: string,
    purchaseOptionId: string,
    offerIds: string[],
  ) {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.onetimeproducts.purchaseOptions.offers.batchGet(
          {
            packageName,
            productId,
            purchaseOptionId,
            requestBody: {
              requests: offerIds.map((offerId) => ({
                packageName,
                productId,
                purchaseOptionId,
                offerId,
              })),
            },
          },
        );
      return res.data;
    });
  }

  async batchUpdatePurchaseOptionOffers(
    packageName: string,
    productId: string,
    purchaseOptionId: string,
    requests: androidpublisher_v3.Schema$UpdateOneTimeProductOfferRequest[],
  ) {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchUpdatePurchaseOptionOffers");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.onetimeproducts.purchaseOptions.offers.batchUpdate(
          {
            packageName,
            productId,
            purchaseOptionId,
            requestBody: { requests },
          },
        );
      return res.data;
    });
  }

  async batchUpdatePurchaseOptionOfferStates(
    packageName: string,
    productId: string,
    purchaseOptionId: string,
    requests: androidpublisher_v3.Schema$UpdateOneTimeProductOfferStateRequest[],
  ) {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchUpdatePurchaseOptionOfferStates");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.monetization.onetimeproducts.purchaseOptions.offers.batchUpdateStates(
          {
            packageName,
            productId,
            purchaseOptionId,
            requestBody: { requests },
          },
        );
      return res.data;
    });
  }

  async batchDeletePurchaseOptionOffers(
    packageName: string,
    productId: string,
    purchaseOptionId: string,
    offerIds: string[],
  ): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("monetization.batchDeletePurchaseOptionOffers");
    await this.client.request(async () => {
      await this.client.publisher.monetization.onetimeproducts.purchaseOptions.offers.batchDelete(
        {
          packageName,
          productId,
          purchaseOptionId,
          requestBody: {
            requests: offerIds.map((offerId) => ({
              packageName,
              productId,
              purchaseOptionId,
              offerId,
            })),
          },
        },
      );
    });
  }

  // ── Pricing ────────────────────────────────────────────────────

  async convertRegionPrices(
    packageName: string,
    price: androidpublisher_v3.Schema$Money,
  ): Promise<ConvertRegionPricesResponse> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.monetization.convertRegionPrices({
        packageName,
        requestBody: { price },
      });
      return res.data;
    });
  }
}
