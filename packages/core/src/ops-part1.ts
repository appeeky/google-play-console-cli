import { z, type ZodRawShape } from "zod";
import type { PlayStoreClient } from "./client.js";
import type { ImageType } from "./resources/listings.js";

export interface GpsOp {
  name: string;
  group: string;
  summary: string;
  write: boolean;
  shape: ZodRawShape;
  run: (client: PlayStoreClient, args: Record<string, unknown>) => Promise<unknown>;
}

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

export const GPS_OPS: GpsOp[] = [
  // meta
  {
    name: "gps_whoami",
    group: "meta",
    summary: "Show authenticated service account email and read-only mode",
    write: false,
    shape: {},
    run: async (c) => ({ clientEmail: c.clientEmail, readOnly: c.readOnly }),
  },

  // reviews
  {
    name: "gps_list_reviews",
    group: "reviews",
    summary: "List Play Store reviews",
    write: false,
    shape: {
      packageName: pkg,
      maxResults: z.number().optional(),
      token: z.string().optional(),
      translationLanguage: z.string().optional(),
    },
    run: async (c, a) =>
      c.reviews.list(asString(a.packageName, "packageName"), {
        maxResults: a.maxResults as number | undefined,
        token: a.token as string | undefined,
        translationLanguage: a.translationLanguage as string | undefined,
      }),
  },
  {
    name: "gps_get_review",
    group: "reviews",
    summary: "Get a single review",
    write: false,
    shape: { packageName: pkg, reviewId: z.string(), translationLanguage: z.string().optional() },
    run: async (c, a) =>
      c.reviews.get(asString(a.packageName, "packageName"), asString(a.reviewId, "reviewId"), {
        translationLanguage: a.translationLanguage as string | undefined,
      }),
  },
  {
    name: "gps_reply_to_review",
    group: "reviews",
    summary: "Reply to a review",
    write: true,
    shape: { packageName: pkg, reviewId: z.string(), replyText: z.string() },
    run: async (c, a) =>
      c.reviews.reply(
        asString(a.packageName, "packageName"),
        asString(a.reviewId, "reviewId"),
        asString(a.replyText, "replyText"),
      ),
  },

  // deploy / tracks
  {
    name: "gps_deploy_app",
    group: "deploy",
    summary: "Upload APK/AAB and assign to a track",
    write: true,
    shape: {
      packageName: pkg,
      filePath: z.string(),
      track: z.string(),
      userFraction: z.number().optional(),
      releaseNotes: z.array(z.object({ language: z.string(), text: z.string() })).optional(),
      status: z.enum(["draft", "inProgress", "halted", "completed"]).optional(),
      validateOnly: z.boolean().optional(),
      changesNotSentForReview: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.deploy.deploy(asString(a.packageName, "packageName"), {
        filePath: asString(a.filePath, "filePath"),
        track: asString(a.track, "track"),
        userFraction: a.userFraction as number | undefined,
        releaseNotes: a.releaseNotes as { language: string; text: string }[] | undefined,
        status: a.status as "draft" | "inProgress" | "halted" | "completed" | undefined,
        validateOnly: a.validateOnly as boolean | undefined,
        changesNotSentForReview: a.changesNotSentForReview as boolean | undefined,
      }),
  },
  {
    name: "gps_list_tracks",
    group: "tracks",
    summary: "List release tracks",
    write: false,
    shape: { packageName: pkg },
    run: async (c, a) => c.tracks.listCommitted(asString(a.packageName, "packageName")),
  },
  {
    name: "gps_get_track",
    group: "tracks",
    summary: "Get a release track",
    write: false,
    shape: { packageName: pkg, track: z.string() },
    run: async (c, a) =>
      c.edits.withEphemeralEdit(asString(a.packageName, "packageName"), (editId) =>
        c.tracks.get(asString(a.packageName, "packageName"), editId, asString(a.track, "track")),
      ),
  },
  {
    name: "gps_list_track_releases",
    group: "tracks",
    summary: "List releases on a track",
    write: false,
    shape: { packageName: pkg, track: z.string() },
    run: async (c, a) =>
      c.tracks.listReleases(asString(a.packageName, "packageName"), asString(a.track, "track")),
  },
  {
    name: "gps_update_track",
    group: "tracks",
    summary: "Update a track inside a committed edit",
    write: true,
    shape: {
      packageName: pkg,
      track: z.string(),
      body: json,
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          (editId) =>
            c.tracks.update(
              asString(a.packageName, "packageName"),
              editId,
              asString(a.track, "track"),
              asObj(a.body, "body"),
            ),
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },
  {
    name: "gps_promote_release",
    group: "tracks",
    summary: "Promote a release between tracks",
    write: true,
    shape: {
      packageName: pkg,
      fromTrack: z.string(),
      toTrack: z.string(),
      userFraction: z.number().optional(),
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.tracks.promoteRelease(
        asString(a.packageName, "packageName"),
        asString(a.fromTrack, "fromTrack"),
        asString(a.toTrack, "toTrack"),
        {
          userFraction: a.userFraction as number | undefined,
          validateOnly: a.validateOnly as boolean | undefined,
        },
      ),
  },
  {
    name: "gps_update_rollout",
    group: "tracks",
    summary: "Update staged rollout fraction",
    write: true,
    shape: {
      packageName: pkg,
      track: z.string(),
      userFraction: z.number(),
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.tracks.updateRollout(
        asString(a.packageName, "packageName"),
        asString(a.track, "track"),
        asNumber(a.userFraction, "userFraction"),
        { validateOnly: a.validateOnly as boolean | undefined },
      ),
  },
  {
    name: "gps_halt_release",
    group: "tracks",
    summary: "Halt an in-progress staged rollout",
    write: true,
    shape: { packageName: pkg, track: z.string(), validateOnly: z.boolean().optional() },
    run: async (c, a) =>
      c.tracks.haltRelease(asString(a.packageName, "packageName"), asString(a.track, "track"), {
        validateOnly: a.validateOnly as boolean | undefined,
      }),
  },

  // listings + images
  {
    name: "gps_list_listings",
    group: "listings",
    summary: "List all localized store listings",
    write: false,
    shape: { packageName: pkg },
    run: async (c, a) => c.listings.listAllListings(asString(a.packageName, "packageName")),
  },
  {
    name: "gps_get_listing",
    group: "listings",
    summary: "Get a localized store listing",
    write: false,
    shape: { packageName: pkg, language: z.string() },
    run: async (c, a) =>
      c.edits.withEphemeralEdit(asString(a.packageName, "packageName"), (editId) =>
        c.listings.get(
          asString(a.packageName, "packageName"),
          editId,
          asString(a.language, "language"),
        ),
      ),
  },
  {
    name: "gps_update_listing",
    group: "listings",
    summary: "Update a localized store listing",
    write: true,
    shape: {
      packageName: pkg,
      language: z.string(),
      title: z.string().optional(),
      shortDescription: z.string().optional(),
      fullDescription: z.string().optional(),
      video: z.string().optional(),
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.listings.updateListing(
        asString(a.packageName, "packageName"),
        asString(a.language, "language"),
        {
          language: asString(a.language, "language"),
          title: a.title as string | undefined,
          shortDescription: a.shortDescription as string | undefined,
          fullDescription: a.fullDescription as string | undefined,
          video: a.video as string | undefined,
        },
        { validateOnly: a.validateOnly as boolean | undefined },
      ),
  },
  {
    name: "gps_delete_listing",
    group: "listings",
    summary: "Delete a localized store listing",
    write: true,
    shape: { packageName: pkg, language: z.string(), validateOnly: z.boolean().optional() },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          async (editId) => {
            await c.listings.delete(
              asString(a.packageName, "packageName"),
              editId,
              asString(a.language, "language"),
            );
            return { deleted: a.language };
          },
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },
  {
    name: "gps_delete_all_listings",
    group: "listings",
    summary: "Delete all localized store listings",
    write: true,
    shape: { packageName: pkg, validateOnly: z.boolean().optional() },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          async (editId) => {
            await c.listings.deleteAll(asString(a.packageName, "packageName"), editId);
            return { deletedAll: true };
          },
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },
  {
    name: "gps_list_images",
    group: "listings",
    summary: "List listing images for language + image type",
    write: false,
    shape: {
      packageName: pkg,
      language: z.string(),
      imageType: z.string(),
    },
    run: async (c, a) =>
      c.edits.withEphemeralEdit(asString(a.packageName, "packageName"), (editId) =>
        c.listings.listImages(
          asString(a.packageName, "packageName"),
          editId,
          asString(a.language, "language"),
          asString(a.imageType, "imageType") as ImageType,
        ),
      ),
  },
  {
    name: "gps_upload_image",
    group: "listings",
    summary: "Upload a listing image",
    write: true,
    shape: {
      packageName: pkg,
      language: z.string(),
      imageType: z.string(),
      filePath: z.string(),
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          (editId) =>
            c.listings.uploadImage(
              asString(a.packageName, "packageName"),
              editId,
              asString(a.language, "language"),
              asString(a.imageType, "imageType") as ImageType,
              asString(a.filePath, "filePath"),
            ),
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },
  {
    name: "gps_delete_image",
    group: "listings",
    summary: "Delete a listing image by id",
    write: true,
    shape: {
      packageName: pkg,
      language: z.string(),
      imageType: z.string(),
      imageId: z.string(),
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          async (editId) => {
            await c.listings.deleteImage(
              asString(a.packageName, "packageName"),
              editId,
              asString(a.language, "language"),
              asString(a.imageType, "imageType") as ImageType,
              asString(a.imageId, "imageId"),
            );
            return { deleted: a.imageId };
          },
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },
  {
    name: "gps_delete_all_images",
    group: "listings",
    summary: "Delete all listing images for language + type",
    write: true,
    shape: {
      packageName: pkg,
      language: z.string(),
      imageType: z.string(),
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.edits
        .withEdit(
          asString(a.packageName, "packageName"),
          async (editId) => {
            await c.listings.deleteAllImages(
              asString(a.packageName, "packageName"),
              editId,
              asString(a.language, "language"),
              asString(a.imageType, "imageType") as ImageType,
            );
            return { deletedAll: true };
          },
          { validateOnly: a.validateOnly as boolean | undefined },
        )
        .then((r) => r.result),
  },

  // testers
  {
    name: "gps_get_testers",
    group: "testers",
    summary: "Get testers for a track",
    write: false,
    shape: { packageName: pkg, track: z.string() },
    run: async (c, a) =>
      c.edits.withEphemeralEdit(asString(a.packageName, "packageName"), (editId) =>
        c.testers.get(asString(a.packageName, "packageName"), editId, asString(a.track, "track")),
      ),
  },
  {
    name: "gps_update_testers",
    group: "testers",
    summary: "Update testers for a track",
    write: true,
    shape: {
      packageName: pkg,
      track: z.string(),
      googleGroups: strArr.optional(),
      validateOnly: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.testers.updateTesters(
        asString(a.packageName, "packageName"),
        asString(a.track, "track"),
        { googleGroups: a.googleGroups as string[] | undefined },
        { validateOnly: a.validateOnly as boolean | undefined },
      ),
  },

  // subscriptions
  {
    name: "gps_list_subscriptions",
    group: "monetization",
    summary: "List subscriptions",
    write: false,
    shape: { packageName: pkg, pageSize: z.number().optional(), pageToken: z.string().optional() },
    run: async (c, a) =>
      c.monetization.listSubscriptions(asString(a.packageName, "packageName"), {
        pageSize: a.pageSize as number | undefined,
        pageToken: a.pageToken as string | undefined,
      }),
  },
  {
    name: "gps_get_subscription",
    group: "monetization",
    summary: "Get a subscription",
    write: false,
    shape: { packageName: pkg, productId: z.string() },
    run: async (c, a) =>
      c.monetization.getSubscription(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
      ),
  },
  {
    name: "gps_create_subscription",
    group: "monetization",
    summary: "Create a subscription",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      body: json,
      regionsVersion: z.string().optional(),
    },
    run: async (c, a) =>
      c.monetization.createSubscription(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asObj(a.body, "body"),
        { regionsVersion: a.regionsVersion as string | undefined },
      ),
  },
  {
    name: "gps_patch_subscription",
    group: "monetization",
    summary: "Patch a subscription",
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
      c.monetization.patchSubscription(
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
    name: "gps_delete_subscription",
    group: "monetization",
    summary: "Delete a subscription",
    write: true,
    shape: { packageName: pkg, productId: z.string() },
    run: async (c, a) => {
      await c.monetization.deleteSubscription(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
      );
      return { deleted: a.productId };
    },
  },
  {
    name: "gps_batch_get_subscriptions",
    group: "monetization",
    summary: "Batch get subscriptions",
    write: false,
    shape: { packageName: pkg, productIds: strArr },
    run: async (c, a) =>
      c.monetization.batchGetSubscriptions(
        asString(a.packageName, "packageName"),
        asArr<string>(a.productIds, "productIds"),
      ),
  },
  {
    name: "gps_batch_update_subscriptions",
    group: "monetization",
    summary: "Batch update subscriptions",
    write: true,
    shape: { packageName: pkg, requests: z.array(json) },
    run: async (c, a) =>
      c.monetization.batchUpdateSubscriptions(
        asString(a.packageName, "packageName"),
        asArr(a.requests, "requests"),
      ),
  },

  // base plans
  {
    name: "gps_activate_base_plan",
    group: "monetization",
    summary: "Activate a subscription base plan",
    write: true,
    shape: { packageName: pkg, productId: z.string(), basePlanId: z.string() },
    run: async (c, a) =>
      c.monetization.activateBasePlan(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
      ),
  },
  {
    name: "gps_deactivate_base_plan",
    group: "monetization",
    summary: "Deactivate a subscription base plan",
    write: true,
    shape: { packageName: pkg, productId: z.string(), basePlanId: z.string() },
    run: async (c, a) =>
      c.monetization.deactivateBasePlan(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
      ),
  },
  {
    name: "gps_delete_base_plan",
    group: "monetization",
    summary: "Delete a subscription base plan",
    write: true,
    shape: { packageName: pkg, productId: z.string(), basePlanId: z.string() },
    run: async (c, a) => {
      await c.monetization.deleteBasePlan(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
      );
      return { deleted: a.basePlanId };
    },
  },
  {
    name: "gps_migrate_base_plan_prices",
    group: "monetization",
    summary: "Migrate base plan prices",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      basePlanId: z.string(),
      regionalPriceMigrations: z.array(json).optional(),
      regionsVersion: z.string().optional(),
    },
    run: async (c, a) =>
      c.monetization.migrateBasePlanPrices(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
        {
          regionalPriceMigrations: a.regionalPriceMigrations as never,
          regionsVersion: a.regionsVersion as string | undefined,
        },
      ),
  },
  {
    name: "gps_batch_update_base_plan_states",
    group: "monetization",
    summary: "Batch activate/deactivate base plans",
    write: true,
    shape: { packageName: pkg, productId: z.string(), requests: z.array(json) },
    run: async (c, a) =>
      c.monetization.batchUpdateBasePlanStates(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asArr(a.requests, "requests"),
      ),
  },
  {
    name: "gps_batch_migrate_base_plan_prices",
    group: "monetization",
    summary: "Batch migrate base plan prices",
    write: true,
    shape: { packageName: pkg, productId: z.string(), requests: z.array(json) },
    run: async (c, a) =>
      c.monetization.batchMigrateBasePlanPrices(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asArr(a.requests, "requests"),
      ),
  },

  // subscription offers
  {
    name: "gps_list_subscription_offers",
    group: "monetization",
    summary: "List subscription offers",
    write: false,
    shape: { packageName: pkg, productId: z.string(), basePlanId: z.string() },
    run: async (c, a) =>
      c.monetization.listSubscriptionOffers(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
      ),
  },
  {
    name: "gps_get_subscription_offer",
    group: "monetization",
    summary: "Get a subscription offer",
    write: false,
    shape: {
      packageName: pkg,
      productId: z.string(),
      basePlanId: z.string(),
      offerId: z.string(),
    },
    run: async (c, a) =>
      c.monetization.getSubscriptionOffer(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
        asString(a.offerId, "offerId"),
      ),
  },
  {
    name: "gps_create_subscription_offer",
    group: "monetization",
    summary: "Create a subscription offer",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      basePlanId: z.string(),
      offerId: z.string(),
      body: json,
      regionsVersion: z.string().optional(),
    },
    run: async (c, a) =>
      c.monetization.createSubscriptionOffer(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
        asString(a.offerId, "offerId"),
        asObj(a.body, "body"),
        { regionsVersion: a.regionsVersion as string | undefined },
      ),
  },
  {
    name: "gps_patch_subscription_offer",
    group: "monetization",
    summary: "Patch a subscription offer",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      basePlanId: z.string(),
      offerId: z.string(),
      body: json,
      updateMask: z.string().optional(),
      regionsVersion: z.string().optional(),
      allowMissing: z.boolean().optional(),
    },
    run: async (c, a) =>
      c.monetization.patchSubscriptionOffer(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
        asString(a.offerId, "offerId"),
        asObj(a.body, "body"),
        {
          updateMask: a.updateMask as string | undefined,
          regionsVersion: a.regionsVersion as string | undefined,
          allowMissing: a.allowMissing as boolean | undefined,
        },
      ),
  },
  {
    name: "gps_activate_subscription_offer",
    group: "monetization",
    summary: "Activate a subscription offer",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      basePlanId: z.string(),
      offerId: z.string(),
    },
    run: async (c, a) =>
      c.monetization.activateSubscriptionOffer(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
        asString(a.offerId, "offerId"),
      ),
  },
  {
    name: "gps_deactivate_subscription_offer",
    group: "monetization",
    summary: "Deactivate a subscription offer",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      basePlanId: z.string(),
      offerId: z.string(),
    },
    run: async (c, a) =>
      c.monetization.deactivateSubscriptionOffer(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
        asString(a.offerId, "offerId"),
      ),
  },
  {
    name: "gps_delete_subscription_offer",
    group: "monetization",
    summary: "Delete a subscription offer",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      basePlanId: z.string(),
      offerId: z.string(),
    },
    run: async (c, a) => {
      await c.monetization.deleteSubscriptionOffer(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
        asString(a.offerId, "offerId"),
      );
      return { deleted: a.offerId };
    },
  },
  {
    name: "gps_batch_get_subscription_offers",
    group: "monetization",
    summary: "Batch get subscription offers",
    write: false,
    shape: {
      packageName: pkg,
      productId: z.string(),
      basePlanId: z.string(),
      offerIds: strArr,
    },
    run: async (c, a) =>
      c.monetization.batchGetSubscriptionOffers(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
        asArr<string>(a.offerIds, "offerIds"),
      ),
  },
  {
    name: "gps_batch_update_subscription_offers",
    group: "monetization",
    summary: "Batch update subscription offers",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      basePlanId: z.string(),
      requests: z.array(json),
    },
    run: async (c, a) =>
      c.monetization.batchUpdateSubscriptionOffers(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
        asArr(a.requests, "requests"),
      ),
  },
  {
    name: "gps_batch_update_subscription_offer_states",
    group: "monetization",
    summary: "Batch update subscription offer states",
    write: true,
    shape: {
      packageName: pkg,
      productId: z.string(),
      basePlanId: z.string(),
      requests: z.array(json),
    },
    run: async (c, a) =>
      c.monetization.batchUpdateSubscriptionOfferStates(
        asString(a.packageName, "packageName"),
        asString(a.productId, "productId"),
        asString(a.basePlanId, "basePlanId"),
        asArr(a.requests, "requests"),
      ),
  },
];
