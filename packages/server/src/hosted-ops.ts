import { GPS_OPS, type GpsOp } from "@appeeky/google-play-store-core";

/**
 * Arguments that point at the local filesystem. On a hosted server they would
 * read or write the server's files, so ops that take them stay CLI-only
 * (bundle/APK/image uploads, APK downloads).
 */
const LOCAL_FILE_ARGS = ["filePath", "outputPath"];

function isHostable(op: GpsOp): boolean {
  // The accounts group edits ~/.config/gps; the hosted account is the one
  // connected in Appeeky.
  if (op.group === "accounts") return false;
  return !LOCAL_FILE_ARGS.some((arg) => arg in op.shape);
}

/** Operations the hosted server exposes. Writes only when the caller opts in. */
export function hostedOps(allowWrites: boolean): GpsOp[] {
  return GPS_OPS.filter((op) => isHostable(op) && (allowWrites || !op.write));
}
