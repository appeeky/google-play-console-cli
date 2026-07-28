import { z, type ZodRawShape } from "zod";
import type { PlayStoreClient } from "./client.js";
import type { GpsOp } from "./ops-part1.js";

const pkg = z.string().describe("Android application package name");
const json = z.unknown().describe("JSON object body");
const strArr = z.array(z.string());

function asString(v: unknown, name: string): string {
  if (typeof v !== "string" || !v) throw new Error(`${name} is required`);
  return v;
}

function asNumber(v: unknown, name: string): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  throw new Error(`${name} must be a number`);
}

function asObj(v: unknown, name: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error(`${name} must be an object`);
  return v as Record<string, unknown>;
}

function asArr<T = unknown>(v: unknown, name: string): T[] {
  if (!Array.isArray(v)) throw new Error(`${name} must be an array`);
  return v as T[];
}

export const GPS_OPS_PART2: GpsOp[] = [
  // one-time products
  {
    name: "gps_list_one_time_products",
    group: "monetization",
    summary: "List one-time products",
    write: false,
    shape: { packageName: pkg, pageSize: z.number().optional(), pageToken: z.string().optional() },
    run: async (c, a) =>
      c.monetization.listOneTimeProducts(asString(a.packageName, "packageName"), {
        pageSize: a.pageSize as number | undefined,
        pageToken: a.pageToken as string | undefined,
      }),
  },
  {
    name: "gps_get_one_time_product",
    group: "monetization",
    summary: "Get a one-time product",
    write: false,
    shape: { packageName: pkg, productId: z.string() },
    run: async (c, a) =>
      c.monetization.getOneTimeProduct(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
      ),
  },
  {
    name: "gps_patch_one_time_product",
    group: "monetization",
    summary: "Create or update a one-time product",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      body: json,
      updateMask: z.string().optional(),
      regionsVersion: z.string().optional(),
      allowMissing: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.monetization.patchOneTimeProduct(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asObj(a.body, "body"),
        {
          updateMask: a.updateMask as string | undefined,
          regionsVersion: a.regionsVersion as string | undefined,
          allowMissing: a.allowMissing as boolean | undefined,
        },
      ),
  },
  {
    name: "gps_delete_one_time_product",
    group: "monetization",
    summary: "Delete a one-time product",
    write: true,
    shape: { packageName: pkg, productId: z.string() },
    run: async (c, a) => {
      await c.monetization.deleteOneTimeProduct(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
      );
      return { deleted: a.productId };
    },
  },
  {
    name: "gps_batch_get_one_time_products",
    group: "monetization",
    summary: "Batch get one-time products",
    write: false,
    shape: { packageName: pkg, productIds: strArr },
    run: async (c, a) =>
      c.monetization.batchGetOneTimeProducts(
        asString(a.packageName, "packageName"),
        asArr<string>(a.productIds, "productIds"),
      ),
  },
  {
    name: "gps_batch_update_one_time_products",
    group: "monetization",
    summary: "Batch update one-time products",
    write: true,
    shape: { packageName: pkg, requests: z.array(json) },
    run: async (c, a) =>
      c.monetization.batchUpdateOneTimeProducts(
        asString(a.packageName, "packageName"),
        asArr(a.requests, "requests"),
      ),
  },
  {
    name: "gps_batch_delete_one_time_products",
    group: "monetization",
    summary: "Batch delete one-time products",
    write: true,
    shape: { packageName: pkg, productIds: strArr },
    run: async (c, a) => {
      await c.monetization.batchDeleteOneTimeProducts(
        asString(a.packageName, "packageName"),
        asArr<string>(a.productIds, "productIds"),
      );
      return { deleted: a.productIds };
    },
  },
  {
    name: "gps_list_purchase_option_offers",
    group: "monetization",
    summary: "List purchase option offers",
    write: false,
    shape: { packageName: pkg, productId: z.string(), purchaseOptionId: z.string() },
    run: async (c, a) =>
      c.monetization.listPurchaseOptionOffers(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.purchaseOptionId, "purchaseOptionId"),
      ),
  },
  {
    name: "gps_activate_purchase_option_offer",
    group: "monetization",
    summary: "Activate a purchase option offer",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      purchaseOptionId: z.string(),
      offerId: z.string(),
    },
    run: async (c, a) =>
      c.monetization.activatePurchaseOptionOffer(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.purchaseOptionId, "purchaseOptionId"),
        asString(a.offerId, "offerId"),
      ),
  },
  {
    name: "gps_deactivate_purchase_option_offer",
    group: "monetization",
    summary: "Deactivate a purchase option offer",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      purchaseOptionId: z.string(),
      offerId: z.string(),
    },
    run: async (c, a) =>
      c.monetization.deactivatePurchaseOptionOffer(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.purchaseOptionId, "purchaseOptionId"),
        asString(a.offerId, "offerId"),
      ),
  },
  {
    name: "gps_cancel_purchase_option_offer",
    group: "monetization",
    summary: "Cancel a purchase option offer",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      purchaseOptionId: z.string(),
      offerId: z.string(),
    },
    run: async (c, a) =>
      c.monetization.cancelPurchaseOptionOffer(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.purchaseOptionId, "purchaseOptionId"),
        asString(a.offerId, "offerId"),
      ),
  },
  {
    name: "gps_batch_delete_purchase_options",
    group: "monetization",
    summary: "Batch delete purchase options",
    write: true,
    shape: { packageName: pkg, productId: z.string(), purchaseOptionIds: strArr },
    run: async (c, a) => {
      await c.monetization.batchDeletePurchaseOptions(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asArr<string>(a.purchaseOptionIds, "purchaseOptionIds"),
      );
      return { deleted: a.purchaseOptionIds };
    },
  },
  {
    name: "gps_batch_update_purchase_option_states",
    group: "monetization",
    summary: "Batch update purchase option states",
    write: true,
    shape: { packageName: pkg, productId: z.string(), requests: z.array(json) },
    run: async (c, a) =>
      c.monetization.batchUpdatePurchaseOptionStates(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asArr(a.requests, "requests"),
      ),
  },
  {
    name: "gps_batch_get_purchase_option_offers",
    group: "monetization",
    summary: "Batch get purchase option offers",
    write: false,
    shape: {
      packageName: pkg,
      productId: z.string(),
      purchaseOptionId: z.string(),
      offerIds: strArr,
    },
    run: async (c, a) =>
      c.monetization.batchGetPurchaseOptionOffers(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.purchaseOptionId, "purchaseOptionId"),
        asArr<string>(a.offerIds, "offerIds"),
      ),
  },
  {
    name: "gps_batch_update_purchase_option_offers",
    group: "monetization",
    summary: "Batch update purchase option offers",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      purchaseOptionId: z.string(),
      requests: z.array(json),
    },
    run: async (c, a) =>
      c.monetization.batchUpdatePurchaseOptionOffers(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.purchaseOptionId, "purchaseOptionId"),
        asArr(a.requests, "requests"),
      ),
  },
  {
    name: "gps_batch_update_purchase_option_offer_states",
    group: "monetization",
    summary: "Batch update purchase option offer states",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      purchaseOptionId: z.string(),
      requests: z.array(json),
    },
    run: async (c, a) =>
      c.monetization.batchUpdatePurchaseOptionOfferStates(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.purchaseOptionId, "purchaseOptionId"),
        asArr(a.requests, "requests"),
      ),
  },
  {
    name: "gps_batch_delete_purchase_option_offers",
    group: "monetization",
    summary: "Batch delete purchase option offers",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      purchaseOptionId: z.string(),
      offerIds: strArr,
    },
    run: async (c, a) => {
      await c.monetization.batchDeletePurchaseOptionOffers(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.purchaseOptionId, "purchaseOptionId"),
        asArr<string>(a.offerIds, "offerIds"),
      );
      return { deleted: a.offerIds };
    },
  },
  {
    name: "gps_convert_region_prices",
    group: "monetization",
    summary: "Convert a price across Play regions",
    write: false,
    shape: {
      packageName: pkg,
      currencyCode: z.string(),
      units: z.string(),
      nanos: z.number().optional(),
    },
    run: async (c, a) =>
      c.monetization.convertRegionPrices(asString(a.packageName, "packageName"), {
        currencyCode: asString(a.currencyCode, "currencyCode"),
        units: asString(a.units, "units"),
        nanos: a.nanos as number | undefined,
      }),
  },

  // legacy IAP
  {
    name: "gps_list_in_app_products",
    group: "monetization",
    summary: "List legacy in-app products",
    write: false,
    shape: { packageName: pkg, maxResults: z.number().optional(), token: z.string().optional() },
    run: async (c, a) =>
      c.inappproducts.list(asString(a.packageName, "packageName"), {
        maxResults: a.maxResults as number | undefined,
        token: a.token as string | undefined,
      }),
  },
  {
    name: "gps_get_in_app_product",
    group: "monetization",
    summary: "Get a legacy in-app product",
    write: false,
    shape: { packageName: pkg, sku: z.string() },
    run: async (c, a) =>
      c.inappproducts.get(asString(a.packageName, "packageName"), asString(a.sku, "sku")),
  },
  {
    name: "gps_create_in_app_product",
    group: "monetization",
    summary: "Create a legacy in-app product",
    write: true,
    shape: { packageName: pkg, body: json },
    run: async (c, a) =>
      c.inappproducts.insert(asString(a.packageName, "packageName"), asObj(a.body, "body")),
  },
  {
    name: "gps_update_in_app_product",
    group: "monetization",
    summary: "Update a legacy in-app product",
    write: true,
    shape: {
      packageName: pkg,
      sku: z.string(),
      body: json,
      autoConvertMissingPrices: z.boolean().optional(),
      allowMissing: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.inappproducts.update(
        asString(a.packageName, "packageName"),
        asString(a.sku, "sku"),
        asObj(a.body, "body"),
        {
          autoConvertMissingPrices: a.autoConvertMissingPrices as boolean | undefined,
          allowMissing: a.allowMissing as boolean | undefined,
        },
      ),
  },
  {
    name: "gps_patch_in_app_product",
    group: "monetization",
    summary: "Patch a legacy in-app product",
    write: true,
    shape: {
      packageName: pkg,
      sku: z.string(),
      body: json,
      autoConvertMissingPrices: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.inappproducts.patch(
        asString(a.packageName, "packageName"),
        asString(a.sku, "sku"),
        asObj(a.body, "body"),
        { autoConvertMissingPrices: a.autoConvertMissingPrices as boolean | undefined },
      ),
  },
  {
    name: "gps_delete_in_app_product",
    group: "monetization",
    summary: "Delete a legacy in-app product",
    write: true,
    shape: { packageName: pkg, sku: z.string() },
    run: async (c, a) => {
      await c.inappproducts.delete(
        asString(a.packageName, "packageName"),
        asString(a.sku, "sku"),
      );
      return { deleted: a.sku };
    },
  },
  {
    name: "gps_batch_get_in_app_products",
    group: "monetization",
    summary: "Batch get legacy in-app products",
    write: false,
    shape: { packageName: pkg, skus: strArr },
    run: async (c, a) =>
      c.inappproducts.batchGet(
        asString(a.packageName, "packageName"),
        asArr<string>(a.skus, "skus"),
      ),
  },
  {
    name: "gps_batch_update_in_app_products",
    group: "monetization",
    summary: "Batch update legacy in-app products",
    write: true,
    shape: {
      packageName: pkg,
      products: z.array(json),
      autoConvertMissingPrices: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.inappproducts.batchUpdate(
        asString(a.packageName, "packageName"),
        asArr(a.products, "products"),
        { autoConvertMissingPrices: a.autoConvertMissingPrices as boolean | undefined },
      ),
  },
  {
    name: "gps_batch_delete_in_app_products",
    group: "monetization",
    summary: "Batch delete legacy in-app products",
    write: true,
    shape: { packageName: pkg, skus: strArr },
    run: async (c, a) => {
      await c.inappproducts.batchDelete(
        asString(a.packageName, "packageName"),
        asArr<string>(a.skus, "skus"),
      );
      return { deleted: a.skus };
    },
  },

  // purchases
  {
    name: "gps_get_product_purchase",
    group: "purchases",
    summary: "Get in-app product purchase status",
    write: false,
    shape: { packageName: pkg, productId: z.string(), token: z.string() },
    run: async (c, a) =>
      c.purchases.getProductPurchase(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.token, "token"),
      ),
  },
  {
    name: "gps_get_product_purchase_v2",
    group: "purchases",
    summary: "Get in-app product purchase status (v2)",
    write: false,
    shape: { packageName: pkg, token: z.string() },
    run: async (c, a) =>
      c.purchases.getProductPurchaseV2(
        asString(a.packageName, "packageName"),
        asString(a.token, "token"),
      ),
  },
  {
    name: "gps_acknowledge_product_purchase",
    group: "purchases",
    summary: "Acknowledge an in-app product purchase",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      token: z.string(),
      developerPayload: z.string().optional(),
    },
    run: async (c, a) => {
      await c.purchases.acknowledgeProductPurchase(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.token, "token"),
        a.developerPayload as string | undefined,
      );
      return { acknowledged: true };
    },
  },
  {
    name: "gps_consume_product_purchase",
    group: "purchases",
    summary: "Consume a consumable in-app purchase",
    write: true,
    shape: { packageName: pkg, productId: z.string(), token: z.string() },
    run: async (c, a) => {
      await c.purchases.consumeProductPurchase(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.token, "token"),
      );
      return { consumed: true };
    },
  },
  {
    name: "gps_get_subscription_purchase",
    group: "purchases",
    summary: "Get subscription purchase status (v2)",
    write: false,
    shape: { packageName: pkg, token: z.string() },
    run: async (c, a) =>
      c.purchases.getSubscriptionPurchaseV2(
        asString(a.packageName, "packageName"),
        asString(a.token, "token"),
      ),
  },
  {
    name: "gps_cancel_subscription",
    group: "purchases",
    summary: "Cancel a subscription purchase",
    write: true,
    shape: { packageName: pkg, token: z.string(), body: json.optional() },
    run: async (c, a) =>
      c.purchases.cancelSubscription(
        asString(a.packageName, "packageName"),
        asString(a.token, "token"),
        (a.body as Record<string, unknown> | undefined) ?? {},
      ),
  },
  {
    name: "gps_defer_subscription",
    group: "purchases",
    summary: "Defer a subscription renewal",
    write: true,
    shape: { packageName: pkg, token: z.string(), body: json },
    run: async (c, a) =>
      c.purchases.deferSubscription(
        asString(a.packageName, "packageName"),
        asString(a.token, "token"),
        asObj(a.body, "body") as never,
      ),
  },
  {
    name: "gps_revoke_subscription",
    group: "purchases",
    summary: "Revoke a subscription purchase",
    write: true,
    shape: { packageName: pkg, token: z.string(), body: json.optional() },
    run: async (c, a) =>
      c.purchases.revokeSubscription(
        asString(a.packageName, "packageName"),
        asString(a.token, "token"),
        (a.body as Record<string, unknown> | undefined) ?? {},
      ),
  },
  {
    name: "gps_acknowledge_subscription",
    group: "purchases",
    summary: "Acknowledge a subscription purchase (v1)",
    write: true,
    shape: {
      packageName: pkg,
      subscriptionId: z.string(),
      token: z.string(),
      developerPayload: z.string().optional(),
    },
    run: async (c, a) => {
      await c.purchases.acknowledgeSubscription(
        asString(a.packageName, "packageName"),
        asString(a.subscriptionId, "subscriptionId"),
        asString(a.token, "token"),
        a.developerPayload as string | undefined,
      );
      return { acknowledged: true };
    },
  },
  {
    name: "gps_list_voided_purchases",
    group: "purchases",
    summary: "List voided purchases",
    write: false,
    shape: {
      packageName: pkg,
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      maxResults: z.number().optional(),
      token: z.string().optional(),
      type: z.number().optional(),
    },
    run: async (c, a) =>
      c.purchases.listVoidedPurchases(asString(a.packageName, "packageName"), {
        startTime: a.startTime as string | undefined,
        endTime: a.endTime as string | undefined,
        maxResults: a.maxResults as number | undefined,
        token: a.token as string | undefined,
        type: a.type as number | undefined,
      }),
  },

  // orders + external tx
  {
    name: "gps_get_order",
    group: "orders",
    summary: "Get order details",
    write: false,
    shape: { packageName: pkg, orderId: z.string() },
    run: async (c, a) =>
      c.orders.get(asString(a.packageName, "packageName"), asString(a.orderId, "orderId")),
  },
  {
    name: "gps_batch_get_orders",
    group: "orders",
    summary: "Batch get orders",
    write: false,
    shape: { packageName: pkg, orderIds: strArr },
    run: async (c, a) =>
      c.orders.batchGet(
        asString(a.packageName, "packageName"),
        asArr<string>(a.orderIds, "orderIds"),
      ),
  },
  {
    name: "gps_refund_order",
    group: "orders",
    summary: "Refund an order",
    write: true,
    shape: { packageName: pkg, orderId: z.string(), revoke: z.boolean().optional() },
    run: async (c, a) => {
      await c.orders.refund(
        asString(a.packageName, "packageName"),
        asString(a.orderId, "orderId"),
        { revoke: a.revoke as boolean | undefined },
      );
      return { refunded: a.orderId, revoke: !!a.revoke };
    },
  },
  {
    name: "gps_get_external_transaction",
    group: "orders",
    summary: "Get an external transaction",
    write: false,
    shape: { packageName: pkg, externalTransactionId: z.string() },
    run: async (c, a) =>
      c.externalTransactions.get(
        asString(a.packageName, "packageName"),
        asString(a.externalTransactionId, "externalTransactionId"),
      ),
  },
  {
    name: "gps_create_external_transaction",
    group: "orders",
    summary: "Create an external transaction",
    write: true,
    shape: { packageName: pkg, externalTransactionId: z.string(), body: json },
    run: async (c, a) =>
      c.externalTransactions.create(
        asString(a.packageName, "packageName"),
        asString(a.externalTransactionId, "externalTransactionId"),
        asObj(a.body, "body"),
      ),
  },
  {
    name: "gps_refund_external_transaction",
    group: "orders",
    summary: "Refund an external transaction",
    write: true,
    shape: {
      packageName: pkg,
      externalTransactionId: z.string(),
      body: json.optional(),
    },
    run: async (c, a) =>
      c.externalTransactions.refund(
        asString(a.packageName, "packageName"),
        asString(a.externalTransactionId, "externalTransactionId"),
        (a.body as Record<string, unknown> | undefined) ?? {},
      ),
  },

  // users / grants
  {
    name: "gps_list_users",
    group: "users",
    summary: "List Play Console users",
    write: false,
    shape: {
      developerId: z.string(),
      pageSize: z.number().optional(),
      pageToken: z.string().optional(),
    },
    run: async (c, a) =>
      c.users.list(asString(a.developerId, "developerId"), {
        pageSize: a.pageSize as number | undefined,
        pageToken: a.pageToken as string | undefined,
      }),
  },
  {
    name: "gps_create_user",
    group: "users",
    summary: "Create / invite a Play Console user",
    write: true,
    shape: { developerId: z.string(), body: json },
    run: async (c, a) =>
      c.users.create(asString(a.developerId, "developerId"), asObj(a.body, "body")),
  },
  {
    name: "gps_patch_user",
    group: "users",
    summary: "Update a Play Console user",
    write: true,
    shape: {
      developerId: z.string(),
      email: z.string(),
      body: json,
      updateMask: z.string().optional(),
    },
    run: async (c, a) =>
      c.users.patch(
        asString(a.developerId, "developerId"),
        asString(a.email, "email"),
        asObj(a.body, "body"),
        { updateMask: a.updateMask as string | undefined },
      ),
  },
  {
    name: "gps_delete_user",
    group: "users",
    summary: "Remove a Play Console user",
    write: true,
    shape: { developerId: z.string(), email: z.string() },
    run: async (c, a) => {
      await c.users.delete(asString(a.developerId, "developerId"), asString(a.email, "email"));
      return { deleted: a.email };
    },
  },
  {
    name: "gps_create_grant",
    group: "users",
    summary: "Grant app-level access to a user",
    write: true,
    shape: { developerId: z.string(), email: z.string(), body: json },
    run: async (c, a) =>
      c.users.createGrant(
        asString(a.developerId, "developerId"),
        asString(a.email, "email"),
        asObj(a.body, "body"),
      ),
  },
  {
    name: "gps_patch_grant",
    group: "users",
    summary: "Update an app-level grant",
    write: true,
    shape: {
      developerId: z.string(),
      email: z.string(),
      packageName: pkg,
      body: json,
      updateMask: z.string().optional(),
    },
    run: async (c, a) =>
      c.users.patchGrant(
        asString(a.developerId, "developerId"),
        asString(a.email, "email"),
        asString(a.packageName, "packageName"),
        asObj(a.body, "body"),
        { updateMask: a.updateMask as string | undefined },
      ),
  },
  {
    name: "gps_delete_grant",
    group: "users",
    summary: "Remove an app-level grant",
    write: true,
    shape: { developerId: z.string(), email: z.string(), packageName: pkg },
    run: async (c, a) => {
      await c.users.deleteGrant(
        asString(a.developerId, "developerId"),
        asString(a.email, "email"),
        asString(a.packageName, "packageName"),
      );
      return { deleted: a.packageName };
    },
  },

  // artifacts
  {
    name: "gps_list_apks",
    group: "artifacts",
    summary: "List APKs in a temporary edit",
    write: false,
    shape: { packageName: pkg },
    run: async (c, a) =>
      c.edits.withEphemeralEdit(asString(a.packageName, "packageName"), (editId) =>
        c.artifacts.listApks(asString(a.packageName, "packageName"), editId),
      ),
  },
  {
    name: "gps_list_bundles",
    group: "artifacts",
    summary: "List bundles in a temporary edit",
    write: false,
    shape: { packageName: pkg },
    run: async (c, a) =>
      c.edits.withEphemeralEdit(asString(a.packageName, "packageName"), (editId) =>
        c.artifacts.listBundles(asString(a.packageName, "packageName"), editId),
      ),
  },
  {
    name: "gps_upload_apk",
    group: "artifacts",
    summary: "Upload an APK into a committed edit",
    write: true,
    shape: { packageName: pkg, filePath: z.string(), validateOnly: z.boolean().optional() },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          (editId) =>
            c.artifacts.uploadApk(
              asString(a.packageName, "packageName"),
              editId,
              asString(a.filePath, "filePath"),
            ),
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },
  {
    name: "gps_upload_bundle",
    group: "artifacts",
    summary: "Upload an AAB into a committed edit",
    write: true,
    shape: {
      packageName: pkg,
      filePath: z.string(),
      ackBundleInstallationWarning: z.boolean().optional(),
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          (editId) =>
            c.artifacts.uploadBundle(
              asString(a.packageName, "packageName"),
              editId,
              asString(a.filePath, "filePath"),
              {
                ackBundleInstallationWarning: a.ackBundleInstallationWarning as
                  | boolean
                  | undefined,
              },
            ),
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },
  {
    name: "gps_add_externally_hosted_apk",
    group: "artifacts",
    summary: "Add an externally hosted APK to an edit",
    write: true,
    shape: {
      packageName: pkg,
      externallyHostedApk: json,
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          (editId) =>
            c.artifacts.addExternallyHostedApk(
              asString(a.packageName, "packageName"),
              editId,
              asObj(a.externallyHostedApk, "externallyHostedApk"),
            ),
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },
  {
    name: "gps_upload_deobfuscation_file",
    group: "artifacts",
    summary: "Upload a deobfuscation/mapping file",
    write: true,
    shape: {
      packageName: pkg,
      apkVersionCode: z.number(),
      deobfuscationFileType: z.enum(["proguard", "nativeCode"]),
      filePath: z.string(),
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          (editId) =>
            c.artifacts.uploadDeobfuscationFile(
              asString(a.packageName, "packageName"),
              editId,
              asNumber(a.apkVersionCode, "apkVersionCode"),
              a.deobfuscationFileType as "proguard" | "nativeCode",
              asString(a.filePath, "filePath"),
            ),
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },
  {
    name: "gps_get_expansion_file",
    group: "artifacts",
    summary: "Get expansion file info",
    write: false,
    shape: {
      packageName: pkg,
      apkVersionCode: z.number(),
      expansionFileType: z.enum(["main", "patch"]),
    },
    run: async (c, a) =>
      c.edits.withEphemeralEdit(asString(a.packageName, "packageName"), (editId) =>
        c.artifacts.getExpansionFile(
          asString(a.packageName, "packageName"),
          editId,
          asNumber(a.apkVersionCode, "apkVersionCode"),
          a.expansionFileType as "main" | "patch",
        ),
      ),
  },
  {
    name: "gps_upload_expansion_file",
    group: "artifacts",
    summary: "Upload an expansion file",
    write: true,
    shape: {
      packageName: pkg,
      apkVersionCode: z.number(),
      expansionFileType: z.enum(["main", "patch"]),
      filePath: z.string(),
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          (editId) =>
            c.artifacts.uploadExpansionFile(
              asString(a.packageName, "packageName"),
              editId,
              asNumber(a.apkVersionCode, "apkVersionCode"),
              a.expansionFileType as "main" | "patch",
              asString(a.filePath, "filePath"),
            ),
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },
  {
    name: "gps_get_app_details",
    group: "artifacts",
    summary: "Get app details from a temporary edit",
    write: false,
    shape: { packageName: pkg },
    run: async (c, a) =>
      c.edits.withEphemeralEdit(asString(a.packageName, "packageName"), (editId) =>
        c.artifacts.getDetails(asString(a.packageName, "packageName"), editId),
      ),
  },
  {
    name: "gps_patch_app_details",
    group: "artifacts",
    summary: "Patch app details",
    write: true,
    shape: { packageName: pkg, body: json, validateOnly: z.boolean().optional() },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          (editId) =>
            c.artifacts.patchDetails(
              asString(a.packageName, "packageName"),
              editId,
              asObj(a.body, "body"),
            ),
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },
  {
    name: "gps_get_country_availability",
    group: "artifacts",
    summary: "Get country availability for a track",
    write: false,
    shape: { packageName: pkg, track: z.string() },
    run: async (c, a) =>
      c.edits.withEphemeralEdit(asString(a.packageName, "packageName"), (editId) =>
        c.artifacts.getCountryAvailability(
          asString(a.packageName, "packageName"),
          editId,
          asString(a.track, "track"),
        ),
      ),
  },
  {
    name: "gps_upload_internal_sharing",
    group: "artifacts",
    summary: "Upload APK/AAB to internal app sharing",
    write: true,
    shape: { packageName: pkg, filePath: z.string() },
    run: async (c, a) => {
      const filePath = asString(a.filePath, "filePath");
      return filePath.toLowerCase().endsWith(".aab")
        ? c.internalSharing.uploadBundle(asString(a.packageName, "packageName"), filePath)
        : c.internalSharing.uploadApk(asString(a.packageName, "packageName"), filePath);
    },
  },
  {
    name: "gps_list_generated_apks",
    group: "artifacts",
    summary: "List Play-generated APKs for a version code",
    write: false,
    shape: { packageName: pkg, versionCode: z.number() },
    run: async (c, a) =>
      c.generatedApks.list(
        asString(a.packageName, "packageName"),
        asNumber(a.versionCode, "versionCode"),
      ),
  },
  {
    name: "gps_download_generated_apk",
    group: "artifacts",
    summary: "Download a Play-generated APK",
    write: false,
    shape: {
      packageName: pkg,
      versionCode: z.number(),
      downloadId: z.string(),
      outputPath: z.string(),
    },
    run: async (c, a) =>
      c.generatedApks.download(
        asString(a.packageName, "packageName"),
        asNumber(a.versionCode, "versionCode"),
        asString(a.downloadId, "downloadId"),
        asString(a.outputPath, "outputPath"),
      ),
  },
  {
    name: "gps_list_system_apk_variants",
    group: "artifacts",
    summary: "List system APK variants",
    write: false,
    shape: { packageName: pkg, versionCode: z.number() },
    run: async (c, a) =>
      c.systemApks.list(
        asString(a.packageName, "packageName"),
        asNumber(a.versionCode, "versionCode"),
      ),
  },
  {
    name: "gps_get_system_apk_variant",
    group: "artifacts",
    summary: "Get a system APK variant",
    write: false,
    shape: { packageName: pkg, versionCode: z.number(), variantId: z.number() },
    run: async (c, a) =>
      c.systemApks.get(
        asString(a.packageName, "packageName"),
        asNumber(a.versionCode, "versionCode"),
        asNumber(a.variantId, "variantId"),
      ),
  },
  {
    name: "gps_create_system_apk_variant",
    group: "artifacts",
    summary: "Create a system APK variant",
    write: true,
    shape: { packageName: pkg, versionCode: z.number(), body: json },
    run: async (c, a) =>
      c.systemApks.create(
        asString(a.packageName, "packageName"),
        asNumber(a.versionCode, "versionCode"),
        asObj(a.body, "body"),
      ),
  },
  {
    name: "gps_download_system_apk_variant",
    group: "artifacts",
    summary: "Download a system APK variant",
    write: false,
    shape: {
      packageName: pkg,
      versionCode: z.number(),
      variantId: z.number(),
      outputPath: z.string(),
    },
    run: async (c, a) =>
      c.systemApks.download(
        asString(a.packageName, "packageName"),
        asNumber(a.versionCode, "versionCode"),
        asNumber(a.variantId, "variantId"),
        asString(a.outputPath, "outputPath"),
      ),
  },

  // compliance
  {
    name: "gps_set_data_safety",
    group: "compliance",
    summary: "Set data safety labels declaration",
    write: true,
    shape: { packageName: pkg, body: json },
    run: async (c, a) =>
      c.dataSafety.set(asString(a.packageName, "packageName"), asObj(a.body, "body") as never),
  },
  {
    name: "gps_list_app_recoveries",
    group: "compliance",
    summary: "List app recovery actions",
    write: false,
    shape: { packageName: pkg, versionCode: z.union([z.string(), z.number()]).optional() },
    run: async (c, a) =>
      c.appRecovery.list(asString(a.packageName, "packageName"), {
        versionCode: a.versionCode as string | number | undefined,
      }),
  },
  {
    name: "gps_create_app_recovery",
    group: "compliance",
    summary: "Create a draft app recovery action",
    write: true,
    shape: { packageName: pkg, body: json },
    run: async (c, a) =>
      c.appRecovery.create(
        asString(a.packageName, "packageName"),
        asObj(a.body, "body") as never,
      ),
  },
  {
    name: "gps_deploy_app_recovery",
    group: "compliance",
    summary: "Deploy an app recovery action",
    write: true,
    shape: { packageName: pkg, appRecoveryId: z.union([z.string(), z.number()]) },
    run: async (c, a) =>
      c.appRecovery.deploy(
        asString(a.packageName, "packageName"),
        a.appRecoveryId as string | number,
      ),
  },
  {
    name: "gps_cancel_app_recovery",
    group: "compliance",
    summary: "Cancel an app recovery action",
    write: true,
    shape: { packageName: pkg, appRecoveryId: z.union([z.string(), z.number()]) },
    run: async (c, a) =>
      c.appRecovery.cancel(
        asString(a.packageName, "packageName"),
        a.appRecoveryId as string | number,
      ),
  },
  {
    name: "gps_add_app_recovery_targeting",
    group: "compliance",
    summary: "Add targeting to an app recovery action",
    write: true,
    shape: {
      packageName: pkg,
      appRecoveryId: z.union([z.string(), z.number()]),
      body: json,
    },
    run: async (c, a) =>
      c.appRecovery.addTargeting(
        asString(a.packageName, "packageName"),
        a.appRecoveryId as string | number,
        asObj(a.body, "body") as never,
      ),
  },
  {
    name: "gps_list_device_tier_configs",
    group: "compliance",
    summary: "List device tier configs",
    write: false,
    shape: { packageName: pkg, pageSize: z.number().optional(), pageToken: z.string().optional() },
    run: async (c, a) =>
      c.deviceTierConfigs.list(asString(a.packageName, "packageName"), {
        pageSize: a.pageSize as number | undefined,
        pageToken: a.pageToken as string | undefined,
      }),
  },
  {
    name: "gps_get_device_tier_config",
    group: "compliance",
    summary: "Get a device tier config",
    write: false,
    shape: { packageName: pkg, deviceTierConfigId: z.string() },
    run: async (c, a) =>
      c.deviceTierConfigs.get(
        asString(a.packageName, "packageName"),
        asString(a.deviceTierConfigId, "deviceTierConfigId"),
      ),
  },
  {
    name: "gps_create_device_tier_config",
    group: "compliance",
    summary: "Create a device tier config",
    write: true,
    shape: {
      packageName: pkg,
      body: json,
      allowUnknownDevices: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.deviceTierConfigs.create(
        asString(a.packageName, "packageName"),
        asObj(a.body, "body"),
        { allowUnknownDevices: a.allowUnknownDevices as boolean | undefined },
      ),
  },
];

// silence unused import if tree shakes oddly
void (0 as unknown as ZodRawShape);
