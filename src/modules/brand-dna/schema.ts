import { z } from 'zod/v4';

export const ColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  name: z.string(),
  usage: z.string().optional(),
});
export type Color = z.infer<typeof ColorSchema>;

export const ColorPaletteSchema = z.object({
  primary: z.array(ColorSchema),
  secondary: z.array(ColorSchema),
  accent: z.array(ColorSchema),
  forbidden: z.array(ColorSchema),
  backgroundPreference: z.enum(['light', 'dark', 'colorful', 'neutral']),
});
export type ColorPalette = z.infer<typeof ColorPaletteSchema>;

export const TypographySchema = z.object({
  primaryFont: z.string(),
  secondaryFont: z.string().optional(),
  style: z.enum(['serif', 'sans-serif', 'display', 'monospace', 'script']),
  weight: z.enum([
    'light',
    'regular',
    'medium',
    'semibold',
    'bold',
    'black',
  ]),
  casing: z
    .enum(['sentence', 'title', 'upper', 'lower', 'mixed'])
    .optional(),
});
export type Typography = z.infer<typeof TypographySchema>;

export const CompositionSchema = z.object({
  preferredFraming: z.array(z.string()),
  whitespaceUse: z.enum(['minimal', 'moderate', 'generous']),
  subjectScale: z.enum(['close-up', 'medium', 'wide', 'mixed']),
  cameraAngles: z.array(z.string()),
});
export type Composition = z.infer<typeof CompositionSchema>;

export const BrandDNASchema = z.object({
  // Identity
  brandName: z.string().min(1),
  industry: z.string().min(1),
  brandPersonality: z.array(z.string()).min(1),

  // Color
  colorPalette: ColorPaletteSchema,

  // Typography
  typography: TypographySchema,

  // Visual Style
  visualStyle: z.string().min(1),
  mood: z.array(z.string()).min(1),
  lightingStyle: z.string().min(1),
  colorTreatment: z.string().min(1),

  // Composition
  composition: CompositionSchema,

  // Content Rules
  forbiddenElements: z.array(z.string()),
  requiredElements: z.array(z.string()).optional(),
  subjectTypes: z.array(z.string()),

  // Metadata
  version: z.number().int().positive(),
  extractedAt: z.coerce.date(),
  extractionConfidence: z.number().min(0).max(1),
});
export type BrandDNA = z.infer<typeof BrandDNASchema>;
