import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export type ExternalTransaction = androidpublisher_v3.Schema$ExternalTransaction;

export class ExternalTransactionsApi {
  constructor(private readonly client: PlayStoreClient) {}

  async get(
    packageName: string,
    externalTransactionId: string,
  ): Promise<ExternalTransaction> {
    assertPackageName(packageName);
    return this.client.request(async () => {
      const res = await this.client.publisher.externaltransactions.getexternaltransaction({
        name: `applications/${packageName}/externalTransactions/${externalTransactionId}`,
      });
      return res.data;
    });
  }

  async create(
    packageName: string,
    externalTransactionId: string,
    body: ExternalTransaction,
  ): Promise<ExternalTransaction> {
    assertPackageName(packageName);
    this.client.assertWritable("externalTransactions.create");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.externaltransactions.createexternaltransaction({
          parent: `applications/${packageName}`,
          externalTransactionId,
          requestBody: body,
        });
      return res.data;
    });
  }

  async refund(
    packageName: string,
    externalTransactionId: string,
    body: androidpublisher_v3.Schema$ExternalTransaction = {},
  ): Promise<ExternalTransaction> {
    assertPackageName(packageName);
    this.client.assertWritable("externalTransactions.refund");
    return this.client.request(async () => {
      const res =
        await this.client.publisher.externaltransactions.refundexternaltransaction({
          name: `applications/${packageName}/externalTransactions/${externalTransactionId}`,
          requestBody: body as androidpublisher_v3.Schema$RefundExternalTransactionRequest,
        });
      return res.data;
    });
  }
}
