const PACKAGE_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

export const STANDARD_TRACKS = [
  "internal",
  "alpha",
  "beta",
  "production",
] as const;

export type StandardTrack = (typeof STANDARD_TRACKS)[number];

export const LISTING_LIMITS = {
  title: 30,
  shortDescription: 80,
  fullDescription: 4000,
} as const;

export function isValidPackageName(packageName: string): boolean {
  return PACKAGE_NAME_RE.test(packageName);
}

export function assertPackageName(packageName: string): void {
  if (!isValidPackageName(packageName)) {
    throw new Error(
      `Invalid package name "${packageName}". Expected reverse-DNS form like com.example.app`,
    );
  }
}

export function isStandardTrack(track: string): track is StandardTrack {
  return (STANDARD_TRACKS as readonly string[]).includes(track);
}

export function assertTrack(track: string): void {
  if (!track || track.trim().length === 0) {
    throw new Error("Track name is required");
  }
}

export interface ListingTextInput {
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
}

export function validateListingText(input: ListingTextInput): string[] {
  const errors: string[] = [];
  if (input.title !== undefined && input.title.length > LISTING_LIMITS.title) {
    errors.push(`title exceeds ${LISTING_LIMITS.title} characters`);
  }
  if (
    input.shortDescription !== undefined &&
    input.shortDescription.length > LISTING_LIMITS.shortDescription
  ) {
    errors.push(
      `shortDescription exceeds ${LISTING_LIMITS.shortDescription} characters`,
    );
  }
  if (
    input.fullDescription !== undefined &&
    input.fullDescription.length > LISTING_LIMITS.fullDescription
  ) {
    errors.push(
      `fullDescription exceeds ${LISTING_LIMITS.fullDescription} characters`,
    );
  }
  return errors;
}
