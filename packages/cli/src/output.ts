import type { GlobalOpts } from "./cli.js";

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function printTable(rows: Array<Record<string, unknown>>): void {
  if (rows.length === 0) {
    console.log("(empty)");
    return;
  }
  const keys = Object.keys(rows[0] ?? {});
  const widths = keys.map((key) =>
    Math.max(key.length, ...rows.map((row) => String(row[key] ?? "").length)),
  );
  const line = (values: string[]) =>
    values.map((v, i) => v.padEnd(widths[i] ?? 0)).join("  ");
  console.log(line(keys));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of rows) {
    console.log(line(keys.map((k) => String(row[k] ?? ""))));
  }
}

export function requireConfirm(opts: GlobalOpts, operation: string): void {
  if (!opts.confirm) {
    throw new Error(
      `Refusing to run write operation "${operation}" without --confirm`,
    );
  }
}
