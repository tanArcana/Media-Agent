import type { BrandDNA } from './schema';

export const DEFAULT_DNA: BrandDNA = {
  brandName: 'Untitled Brand',
  industry: 'general',
  brandPersonality: ['professional', 'clean'],
  colorPalette: {
    primary: [{ hex: '#000000', name: 'Black' }],
    secondary: [],
    accent: [],
    forbidden: [],
    backgroundPreference: 'neutral',
  },
  typography: {
    primaryFont: 'sans-serif',
    style: 'sans-serif',
    weight: 'regular',
  },
  visualStyle: 'clean professional photography',
  mood: ['neutral', 'professional'],
  lightingStyle: 'balanced natural lighting',
  colorTreatment: 'neutral, true-to-life colors',
  composition: {
    preferredFraming: ['rule of thirds'],
    whitespaceUse: 'moderate',
    subjectScale: 'mixed',
    cameraAngles: ['eye-level'],
  },
  forbiddenElements: ['explicit content', 'violence'],
  subjectTypes: ['people', 'products', 'environments'],
  version: 1,
  extractedAt: new Date('2024-01-01T00:00:00Z'),
  extractionConfidence: 0,
};
