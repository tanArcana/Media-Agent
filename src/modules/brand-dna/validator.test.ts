import { describe, it, expect } from 'vitest';
import {
  validateBrandDNA,
  hasPrimaryColors,
  getForbiddenHexColors,
  isColorForbidden,
  computeCompletenessScore,
  nextVersion,
} from './validator';
import { DEFAULT_DNA } from './defaults';
import type { BrandDNA, ColorPalette } from './schema';

// ── validateBrandDNA ─────────────────────────────────────────────────────────

describe('validateBrandDNA', () => {
  it('returns valid for DEFAULT_DNA', () => {
    const result = validateBrandDNA(DEFAULT_DNA);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for an empty object', () => {
    const result = validateBrandDNA({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns errors with readable paths', () => {
    const result = validateBrandDNA({ brandName: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('brandName') || e.includes('industry'))).toBe(true);
  });

  it('returns valid for a fully populated DNA', () => {
    const full: BrandDNA = {
      ...DEFAULT_DNA,
      colorPalette: {
        ...DEFAULT_DNA.colorPalette,
        secondary: [{ hex: '#333333', name: 'Dark Gray' }],
        accent: [{ hex: '#FF0000', name: 'Red' }],
        forbidden: [{ hex: '#00FF00', name: 'Green' }],
      },
      requiredElements: ['logo bottom-right'],
    };
    const result = validateBrandDNA(full);
    expect(result.valid).toBe(true);
  });
});

// ── hasPrimaryColors ─────────────────────────────────────────────────────────

describe('hasPrimaryColors', () => {
  it('returns true when primary has colors', () => {
    expect(hasPrimaryColors(DEFAULT_DNA.colorPalette)).toBe(true);
  });

  it('returns false when primary is empty', () => {
    const palette: ColorPalette = {
      ...DEFAULT_DNA.colorPalette,
      primary: [],
    };
    expect(hasPrimaryColors(palette)).toBe(false);
  });
});

// ── getForbiddenHexColors ────────────────────────────────────────────────────

describe('getForbiddenHexColors', () => {
  it('returns empty set when no forbidden colors', () => {
    const result = getForbiddenHexColors(DEFAULT_DNA.colorPalette);
    expect(result.size).toBe(0);
  });

  it('returns lowercased hex values', () => {
    const palette: ColorPalette = {
      ...DEFAULT_DNA.colorPalette,
      forbidden: [{ hex: '#FF00AA', name: 'Pink' }],
    };
    const result = getForbiddenHexColors(palette);
    expect(result.has('#ff00aa')).toBe(true);
  });
});

// ── isColorForbidden ─────────────────────────────────────────────────────────

describe('isColorForbidden', () => {
  const palette: ColorPalette = {
    ...DEFAULT_DNA.colorPalette,
    forbidden: [{ hex: '#FF0000', name: 'Red' }],
  };

  it('returns true for a forbidden color', () => {
    expect(isColorForbidden('#FF0000', palette)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isColorForbidden('#ff0000', palette)).toBe(true);
  });

  it('returns false for a non-forbidden color', () => {
    expect(isColorForbidden('#00FF00', palette)).toBe(false);
  });
});

// ── computeCompletenessScore ─────────────────────────────────────────────────

describe('computeCompletenessScore', () => {
  it('returns a score between 0 and 1', () => {
    const score = computeCompletenessScore(DEFAULT_DNA);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('returns a higher score for more populated DNA', () => {
    const sparse: BrandDNA = {
      ...DEFAULT_DNA,
      colorPalette: {
        ...DEFAULT_DNA.colorPalette,
        secondary: [],
        accent: [],
      },
      requiredElements: undefined,
    };
    const full: BrandDNA = {
      ...DEFAULT_DNA,
      colorPalette: {
        ...DEFAULT_DNA.colorPalette,
        secondary: [{ hex: '#333333', name: 'Dark Gray' }],
        accent: [{ hex: '#FF0000', name: 'Red' }],
      },
      typography: {
        ...DEFAULT_DNA.typography,
        secondaryFont: 'Georgia',
      },
      requiredElements: ['logo placement'],
    };
    expect(computeCompletenessScore(full)).toBeGreaterThan(
      computeCompletenessScore(sparse),
    );
  });
});

// ── nextVersion ──────────────────────────────────────────────────────────────

describe('nextVersion', () => {
  it('increments version by 1', () => {
    expect(nextVersion(1)).toBe(2);
    expect(nextVersion(5)).toBe(6);
  });
});
