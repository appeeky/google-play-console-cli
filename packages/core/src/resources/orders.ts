import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type Order = androidpublisher_v3.Schema$Order;

export class OrdersApi {
  constructor(private readonly client: PlayStoreClient) {}

  async get(packageName: string, orderId: string): Promise<Order> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.orders.get({ packageName, orderId });
      return res.data;
    });
  }

  async batchGet(packageName: string, orderIds: string[]): Promise<Order[]> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.orders.batchget({
        packageName,
        orderIds,
      });
      return res.data.orders ?? [];
    });
  }

  async refund(
    packageName: string,
    orderId: string,
    options: { revoke?: boolean } = {},
  ): Promise<void> {
    assertPackageName(packageName);
    this.client.assertWritable("orders.refund");
    await this.client.request(async () => {
      await this.client.publisher.orders.refund({
        packageName,
        orderId,
        revoke: options.revoke,
      });
    });
  }
}
