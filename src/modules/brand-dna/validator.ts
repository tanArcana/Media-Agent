import { BrandDNASchema, type BrandDNA, type ColorPalette } from './schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a raw object against the BrandDNA schema.
 * Returns a structured result instead of throwing.
 */
export function validateBrandDNA(data: unknown): ValidationResult {
  const result = BrandDNASchema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    ),
  };
}

/**
 * Checks whether the color palette has at least one primary color defined.
 */
export function hasPrimaryColors(palette: ColorPalette): boolean {
  return palette.primary.length > 0;
}

/**
 * Returns the list of forbidden hex colors for quick lookup.
 */
export function getForbiddenHexColors(palette: ColorPalette): Set<string> {
  return new Set(palette.forbidden.map((c) => c.hex.toLowerCase()));
}

/**
 * Checks whether a given hex color conflicts with the forbidden palette.
 */
export function isColorForbidden(
  hex: string,
  palette: ColorPalette,
): boolean {
  const forbidden = getForbiddenHexColors(palette);
  return forbidden.has(hex.toLowerCase());
}

/**
 * Computes a completeness score (0-1) for a BrandDNA object.
 * Measures how many optional/array fields are populated.
 */
export function computeCompletenessScore(dna: BrandDNA): number {
  let filled = 0;
  let total = 0;

  const checkArray = (arr: unknown[]) => {
    total++;
    if (arr.length > 0) filled++;
  };

  const checkString = (val: string | undefined) => {
    total++;
    if (val && val.length > 0) filled++;
  };

  checkString(dna.brandName);
  checkString(dna.industry);
  checkArray(dna.brandPersonality);
  checkArray(dna.colorPalette.primary);
  checkArray(dna.colorPalette.secondary);
  checkArray(dna.colorPalette.accent);
  checkString(dna.typography.primaryFont);
  checkString(dna.typography.secondaryFont);
  checkString(dna.visualStyle);
  checkArray(dna.mood);
  checkString(dna.lightingStyle);
  checkString(dna.colorTreatment);
  checkArray(dna.composition.preferredFraming);
  checkArray(dna.composition.cameraAngles);
  checkArray(dna.forbiddenElements);
  checkArray(dna.requiredElements ?? []);
  checkArray(dna.subjectTypes);

  return total === 0 ? 0 : filled / total;
}

/**
 * Increments the version number for a new DNA revision.
 */
export function nextVersion(currentVersion: number): number {
  return currentVersion + 1;
}
