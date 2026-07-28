import type { androidpublisher_v3 } from "googleapis";
import type { PlayStoreClient } from "../client.js";
import { assertPackageName } from "../validation.js";

export class DataSafetyApi {
  constructor(private readonly client: PlayStoreClient) {}

  async set(
    packageName: string,
    body: androidpublisher_v3.Schema$SafetyLabelsUpdateRequest,
  ): Promise<androidpublisher_v3.Schema$SafetyLabelsUpdateResponse> {
    assertPackageName(packageName);
    this.client.assertWritable("dataSafety.set");
    return this.client.request(async () => {
      const res = await this.client.publisher.applications.dataSafety({
        packageName,
        requestBody: body,
      });
      return res.data;
    });
  }
}
