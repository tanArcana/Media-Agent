import { describe, it, expect } from 'vitest';
import {
  BrandDNASchema,
  ColorSchema,
  TypographySchema,
  CompositionSchema,
  ColorPaletteSchema,
} from './schema';
import { DEFAULT_DNA } from './defaults';

// ── Helpers ──────────────────────────────────────────────────────────────────

function validDNA(overrides: Record<string, unknown> = {}) {
  return { ...DEFAULT_DNA, extractedAt: DEFAULT_DNA.extractedAt.toISOString(), ...overrides };
}

// ── ColorSchema ──────────────────────────────────────────────────────────────

describe('ColorSchema', () => {
  it('accepts a valid color', () => {
    const result = ColorSchema.safeParse({ hex: '#FF5733', name: 'Coral' });
    expect(result.success).toBe(true);
  });

  it('accepts a color with optional usage', () => {
    const result = ColorSchema.safeParse({ hex: '#FF5733', name: 'Coral', usage: 'primary CTA' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid hex (missing #)', () => {
    const result = ColorSchema.safeParse({ hex: 'FF5733', name: 'Coral' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid hex (too short)', () => {
    const result = ColorSchema.safeParse({ hex: '#FFF', name: 'White' });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const result = ColorSchema.safeParse({ hex: '#FF5733' });
    expect(result.success).toBe(false);
  });
});

// ── TypographySchema ─────────────────────────────────────────────────────────

describe('TypographySchema', () => {
  it('accepts valid typography', () => {
    const result = TypographySchema.safeParse({
      primaryFont: 'Inter',
      style: 'sans-serif',
      weight: 'medium',
    });
    expect(result.success).toBe(true);
  });

  it('accepts typography with all optional fields', () => {
    const result = TypographySchema.safeParse({
      primaryFont: 'Inter',
      secondaryFont: 'Georgia',
      style: 'sans-serif',
      weight: 'bold',
      casing: 'title',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid style', () => {
    const result = TypographySchema.safeParse({
      primaryFont: 'Inter',
      style: 'comic-sans',
      weight: 'regular',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid weight', () => {
    const result = TypographySchema.safeParse({
      primaryFont: 'Inter',
      style: 'sans-serif',
      weight: 'ultra-heavy',
    });
    expect(result.success).toBe(false);
  });
});

// ── CompositionSchema ────────────────────────────────────────────────────────

describe('CompositionSchema', () => {
  it('accepts valid composition', () => {
    const result = CompositionSchema.safeParse({
      preferredFraming: ['rule of thirds'],
      whitespaceUse: 'moderate',
      subjectScale: 'medium',
      cameraAngles: ['eye-level'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid whitespaceUse', () => {
    const result = CompositionSchema.safeParse({
      preferredFraming: [],
      whitespaceUse: 'lots',
      subjectScale: 'medium',
      cameraAngles: [],
    });
    expect(result.success).toBe(false);
  });
});

// ── ColorPaletteSchema ───────────────────────────────────────────────────────

describe('ColorPaletteSchema', () => {
  it('accepts valid palette with empty arrays', () => {
    const result = ColorPaletteSchema.safeParse({
      primary: [],
      secondary: [],
      accent: [],
      forbidden: [],
      backgroundPreference: 'neutral',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid backgroundPreference', () => {
    const result = ColorPaletteSchema.safeParse({
      primary: [],
      secondary: [],
      accent: [],
      forbidden: [],
      backgroundPreference: 'rainbow',
    });
    expect(result.success).toBe(false);
  });
});

// ── BrandDNASchema ───────────────────────────────────────────────────────────

describe('BrandDNASchema', () => {
  it('accepts the DEFAULT_DNA', () => {
    const result = BrandDNASchema.safeParse(DEFAULT_DNA);
    expect(result.success).toBe(true);
  });

  it('accepts valid DNA with ISO date string (coerced)', () => {
    const result = BrandDNASchema.safeParse(validDNA());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.extractedAt).toBeInstanceOf(Date);
    }
  });

  it('rejects empty brandName', () => {
    const result = BrandDNASchema.safeParse(validDNA({ brandName: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects empty brandPersonality array', () => {
    const result = BrandDNASchema.safeParse(validDNA({ brandPersonality: [] }));
    expect(result.success).toBe(false);
  });

  it('rejects empty mood array', () => {
    const result = BrandDNASchema.safeParse(validDNA({ mood: [] }));
    expect(result.success).toBe(false);
  });

  it('rejects version of 0', () => {
    const result = BrandDNASchema.safeParse(validDNA({ version: 0 }));
    expect(result.success).toBe(false);
  });

  it('rejects negative version', () => {
    const result = BrandDNASchema.safeParse(validDNA({ version: -1 }));
    expect(result.success).toBe(false);
  });

  it('rejects non-integer version', () => {
    const result = BrandDNASchema.safeParse(validDNA({ version: 1.5 }));
    expect(result.success).toBe(false);
  });

  it('rejects extractionConfidence > 1', () => {
    const result = BrandDNASchema.safeParse(validDNA({ extractionConfidence: 1.5 }));
    expect(result.success).toBe(false);
  });

  it('rejects extractionConfidence < 0', () => {
    const result = BrandDNASchema.safeParse(validDNA({ extractionConfidence: -0.1 }));
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = BrandDNASchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts requiredElements as optional', () => {
    const data = validDNA();
    delete (data as Record<string, unknown>).requiredElements;
    const result = BrandDNASchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
