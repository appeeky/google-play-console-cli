import { GPS_OPS } from "./ops.js";

export interface Capability {
  id: string;
  group: string;
  summary: string;
  write: boolean;
}

export const CAPABILITIES: Capability[] = GPS_OPS.map((op) => ({
  id: op.name,
  group: op.group,
  summary: op.summary,
  write: op.write,
}));

export function searchCapabilities(query: string): Capability[] {
  const q = query.trim().toLowerCase();
  if (!q) return CAPABILITIES;
  return CAPABILITIES.filter(
    (c) =>
      c.id.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q),
  );
}
