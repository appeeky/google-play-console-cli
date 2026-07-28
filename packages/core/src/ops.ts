import { GPS_OPS as PART1, type GpsOp } from "./ops-part1.js";
import { GPS_OPS_PART2 as PART2 } from "./ops-part2.js";
import { GPS_OPS_ACCOUNTS as ACCOUNTS } from "./ops-accounts.js";
import type { PlayStoreClient } from "./client.js";
import { ValidationError } from "./errors.js";
import { z } from "zod";

export type { GpsOp } from "./ops-part1.js";

export const GPS_OPS: GpsOp[] = [...ACCOUNTS, ...PART1, ...PART2];

const byName = new Map(GPS_OPS.map((op) => [op.name, op]));

export function listOps(query = ""): GpsOp[] {
  const q = query.trim().toLowerCase();
  if (!q) return GPS_OPS;
  return GPS_OPS.filter(
    (op) =>
      op.name.toLowerCase().includes(q) ||
      op.group.toLowerCase().includes(q) ||
      op.summary.toLowerCase().includes(q),
  );
}

export function getOp(name: string): GpsOp {
  const op = byName.get(name);
  if (!op) throw new ValidationError(`Unknown operation: ${name}`);
  return op;
}

export async function invokeOp(
  client: PlayStoreClient,
  name: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const op = getOp(name);
  const parsed = z.object(op.shape).passthrough().parse(args);
  return op.run(client, parsed as Record<string, unknown>);
}
