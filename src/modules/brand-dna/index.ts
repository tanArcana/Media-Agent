export {
  BrandDNASchema,
  ColorSchema,
  ColorPaletteSchema,
  TypographySchema,
  CompositionSchema,
  type BrandDNA,
  type Color,
  type ColorPalette,
  type Typography,
  type Composition,
} from './schema';

export { DEFAULT_DNA } from './defaults';

export {
  validateBrandDNA,
  hasPrimaryColors,
  getForbiddenHexColors,
  isColorForbidden,
  computeCompletenessScore,
  nextVersion,
  type ValidationResult,
} from './validator';
