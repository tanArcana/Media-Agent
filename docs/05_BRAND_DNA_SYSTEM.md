# AEGIS — Brand DNA System

## Overview

Brand DNA is AEGIS's core concept: a structured, machine-readable representation of a brand's visual identity. Every generated asset is constrained by the workspace's DNA, ensuring consistent, on-brand output.

## DNA Schema

```typescript
// src/modules/brand-dna/schema.ts
import { z } from 'zod';

export const ColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  name: z.string(),
  usage: z.string().optional(), // e.g., "primary CTA", "background"
});

export const TypographySchema = z.object({
  primaryFont: z.string(),
  secondaryFont: z.string().optional(),
  style: z.enum(['serif', 'sans-serif', 'display', 'monospace', 'script']),
  weight: z.enum(['light', 'regular', 'medium', 'semibold', 'bold', 'black']),
  casing: z.enum(['sentence', 'title', 'upper', 'lower', 'mixed']).optional(),
});

export const CompositionSchema = z.object({
  preferredFraming: z.array(z.string()),  // e.g., ["rule of thirds", "centered subject"]
  whitespaceUse: z.enum(['minimal', 'moderate', 'generous']),
  subjectScale: z.enum(['close-up', 'medium', 'wide', 'mixed']),
  cameraAngles: z.array(z.string()),       // e.g., ["eye-level", "overhead"]
});

export const BrandDNASchema = z.object({
  // Identity
  brandName: z.string(),
  industry: z.string(),
  brandPersonality: z.array(z.string()),  // e.g., ["trustworthy", "modern", "playful"]

  // Color
  colorPalette: z.object({
    primary: z.array(ColorSchema),
    secondary: z.array(ColorSchema),
    accent: z.array(ColorSchema),
    forbidden: z.array(ColorSchema),      // colors never to use
    backgroundPreference: z.enum(['light', 'dark', 'colorful', 'neutral']),
  }),

  // Typography
  typography: TypographySchema,

  // Visual Style
  visualStyle: z.string(),                // e.g., "clean minimalist lifestyle photography"
  mood: z.array(z.string()),              // e.g., ["warm", "aspirational", "authentic"]
  lightingStyle: z.string(),             // e.g., "soft natural light, golden hour"
  colorTreatment: z.string(),            // e.g., "warm tones, slight desaturation"

  // Composition
  composition: CompositionSchema,

  // Content Rules
  forbiddenElements: z.array(z.string()),  // e.g., ["competitor logos", "violence", "clutter"]
  requiredElements: z.array(z.string()).optional(), // e.g., ["logo placement bottom-right"]
  subjectTypes: z.array(z.string()),       // e.g., ["diverse people aged 25-40", "product close-ups"]

  // Metadata
  version: z.number().int().positive(),
  extractedAt: z.date(),
  extractionConfidence: z.number().min(0).max(1), // how confident the extractor was
});

export type BrandDNA = z.infer<typeof BrandDNASchema>;
```

## DNA Extraction Process

When a user uploads brand materials, the DNA Extractor Sub-Agent processes them:

### Step 1: Material Ingestion
Accepted file types:
- PDF brand guidelines
- PNG/JPG/SVG logos and example images
- PowerPoint/Keynote brand decks (converted to images server-side)

Files are uploaded to S3 under `workspaces/{id}/brand-materials/`.

### Step 2: Agent Analysis
The DNA Extractor Sub-Agent receives URLs for all uploaded files and calls `analyze_image` for each visual asset.

Analysis prompts are tailored by file type:
- **Logo files:** "Extract the primary colors, any text style, and overall visual personality"
- **Example imagery:** "Identify the lighting style, mood, color treatment, composition patterns, and subject types"
- **Brand guidelines PDF:** "Extract color codes, typography specifications, usage rules, and forbidden elements"

### Step 3: DNA Synthesis
After analyzing all materials, the agent synthesizes a single `BrandDNA` object. It:
- Aggregates colors across all materials
- Resolves conflicts (e.g., if two images suggest different moods, pick the dominant one)
- Assigns confidence scores to each field
- Fills in defaults for missing fields

### Step 4: Validation and Storage
The synthesized DNA is parsed through `BrandDNASchema` (Zod). If validation fails, the agent retries with a correction prompt.

On success, the DNA is stored as a `BrandDNA` record in PostgreSQL and associated with the workspace.

## DNA Versioning

Every DNA update creates a new version (incremented integer). The pipeline always uses the `latest` version unless a specific version is pinned in the campaign settings.

Version history is retained indefinitely for audit and rollback.

## DNA in the Pipeline

The DNA influences generation at multiple stages:

| Stage | DNA Fields Used |
|-------|----------------|
| DNA Alignment | All fields — full compliance check |
| Prompt Engineering | `colorPalette`, `visualStyle`, `mood`, `lightingStyle`, `forbiddenElements`, `composition` |
| Quality Gate | `colorPalette`, `visualStyle`, `mood`, `forbiddenElements` |

## DNA Editor UI

Users can manually edit extracted DNA in the Brand DNA editor (`/workspace/[id]/brand-dna`). The UI presents:
- Color pickers for palette fields
- Multi-select tags for style descriptors
- Free-text fields for complex style descriptions
- Live preview showing example prompts generated from the current DNA

Manual edits always create a new DNA version.

## Default DNA

If a workspace has no DNA defined, a permissive default DNA is used:
```typescript
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
  extractedAt: new Date(),
  extractionConfidence: 0,
};
```
