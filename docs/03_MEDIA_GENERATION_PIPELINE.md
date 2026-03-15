# AEGIS — Media Generation Pipeline

## Overview

The pipeline transforms a user brief into a delivered media asset through 6 sequential stages. Each stage is a pure async function that receives and returns a `PipelineContext` object.

```
Brief → DNA Alignment → Prompt Engineering → Generation → Quality Gate → Delivery
  1           2                 3                4              5            6
```

## Pipeline Context

```typescript
// src/modules/pipeline/types.ts

import { z } from 'zod';
import { BrandDNA } from '@/modules/brand-dna';

export const PipelineStage = z.enum([
  'BRIEF_ANALYSIS',
  'DNA_ALIGNMENT',
  'PROMPT_ENGINEERING',
  'GENERATION',
  'QUALITY_GATE',
  'DELIVERY',
]);
export type PipelineStage = z.infer<typeof PipelineStage>;

export const MediaType = z.enum(['IMAGE', 'VIDEO']);
export type MediaType = z.infer<typeof MediaType>;

export const AspectRatio = z.enum(['1:1', '16:9', '9:16', '4:5']);
export type AspectRatio = z.infer<typeof AspectRatio>;

export interface PipelineContext {
  jobId: string;
  workspaceId: string;
  campaignId?: string;

  // Input
  brief: {
    userPrompt: string;
    mediaType: MediaType;
    aspectRatio: AspectRatio;
    referenceImageUrls?: string[];
  };

  // Set by Stage 1
  analyzedBrief?: {
    intent: string;
    keyElements: string[];
    mood: string;
    suggestedCompositions: string[];
  };

  // Set by Stage 2
  dna?: BrandDNA;
  dnaAlignment?: {
    score: number;        // 0-1, how well brief aligns with DNA
    conflicts: string[];  // any conflicts identified
    adjustments: string[]; // adjustments made to satisfy DNA
  };

  // Set by Stage 3
  generationPrompt?: {
    positivePrompt: string;
    negativePrompt: string;
    styleModifiers: string[];
    technicalParams: Record<string, unknown>;
  };

  // Set by Stage 4
  rawOutput?: {
    providerJobId: string;
    outputUrls: string[];
    generationMetadata: Record<string, unknown>;
  };

  // Set by Stage 5
  qualityResult?: {
    passed: boolean;
    overallScore: number;     // 0-1
    brandComplianceScore: number; // 0-1
    safetyScore: number;      // 0-1
    issues: string[];
    requiresHumanReview: boolean;
  };

  // Set by Stage 6
  deliveredAssets?: {
    assetId: string;
    storedUrls: string[];
    thumbnailUrl: string;
    metadata: AssetMetadata;
  };

  // Pipeline bookkeeping
  currentStage: PipelineStage;
  startedAt: Date;
  stageTimings: Record<PipelineStage, number>; // ms
  errors: PipelineError[];
}
```

## Stage 1: Brief Analysis

**Purpose:** Parse the raw user prompt into structured intent.

**Input:** `brief.userPrompt`
**Output:** `analyzedBrief`

**Implementation:**
```typescript
// src/modules/pipeline/stages/01-brief-analysis.ts
export async function briefAnalysis(ctx: PipelineContext): Promise<PipelineContext> {
  const result = await runAgent(briefAnalysisAgent, {
    userPrompt: ctx.brief.userPrompt,
    mediaType: ctx.brief.mediaType,
  });

  return {
    ...ctx,
    analyzedBrief: result,
    currentStage: 'DNA_ALIGNMENT',
  };
}
```

**Failure mode:** If Claude returns malformed JSON, retry once, then fail with `BriefAnalysisError`.

---

## Stage 2: DNA Alignment

**Purpose:** Load Brand DNA for the workspace, check brief against DNA constraints, adjust if needed.

**Input:** `analyzedBrief`, `workspaceId`
**Output:** `dna`, `dnaAlignment`

**Key logic:**
- Load BrandDNA from DB for workspace
- Score alignment: how well does the analyzed brief match DNA?
- If score < 0.5, flag conflicts and apply automatic adjustments
- If score < 0.3, require human approval before continuing

**Failure mode:** If no DNA exists for workspace, use a default permissive DNA and log a warning.

---

## Stage 3: Prompt Engineering

**Purpose:** Craft the optimal positive/negative prompt for the media provider, incorporating DNA constraints.

**Input:** `analyzedBrief`, `dna`, `dnaAlignment`
**Output:** `generationPrompt`

This stage uses the **Prompt Engineer sub-agent** (see `04_AGENT_ORCHESTRATION.md`).

**Prompt construction rules:**
1. Start with the core visual intent from `analyzedBrief.intent`
2. Inject brand color palette as style directives
3. Add typography style if text is in the scene
4. Apply DNA's forbidden elements as negative prompt entries
5. Add technical quality modifiers (resolution, lighting style, etc.)
6. Apply any `dnaAlignment.adjustments`

**Output example:**
```typescript
{
  positivePrompt: "A woman holding a coffee cup in a sun-drenched modern kitchen, warm amber tones, clean minimalist aesthetic, soft natural lighting, high quality, photorealistic",
  negativePrompt: "dark, moody, cluttered, neon colors, cartoonish, low quality, blurry",
  styleModifiers: ["warm amber palette", "minimalist", "natural lighting"],
  technicalParams: {
    model: "fal-ai/flux/dev",
    steps: 28,
    guidanceScale: 7.5,
    width: 1024,
    height: 1024,
  }
}
```

---

## Stage 4: Generation

**Purpose:** Submit the prompt to the media provider and retrieve raw output.

**Input:** `generationPrompt`, `brief.mediaType`, `brief.aspectRatio`
**Output:** `rawOutput`

**Provider interface:**
```typescript
interface MediaProvider {
  generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult>;
  generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult>;
}
```

**Mock provider** (used when `USE_MOCK_PROVIDERS=true`):
- Returns fixture images from `src/modules/media/fixtures/`
- Adds a 500ms artificial delay to simulate real latency
- Always succeeds (use `MOCK_PROVIDER_FAIL_RATE=0.1` env var to test failures)

**Retry policy:**
- 3 attempts with exponential backoff (2s, 4s, 8s)
- On third failure: mark job as `FAILED`, emit error event

---

## Stage 5: Quality Gate

**Purpose:** Evaluate the raw output for brand compliance and content safety.

**Input:** `rawOutput`, `dna`, `brief`
**Output:** `qualityResult`

**Checks performed:**

| Check | Method | Threshold |
|-------|--------|-----------|
| Content safety | Claude vision + safety classifier | Must pass |
| Brand color compliance | Color extraction + palette comparison | > 0.6 |
| Style adherence | Claude vision + DNA descriptor matching | > 0.7 |
| Technical quality | Resolution, artifact detection | Must pass |
| Brand element presence | Logo, typography check (if applicable) | Contextual |

**Routing:**
- `score >= 0.85` → auto-approve, proceed to Delivery
- `0.65 <= score < 0.85` → flag for human review, proceed with warning
- `score < 0.65` → reject, retry from Stage 3 with adjusted prompt (max 2 retries)

---

## Stage 6: Delivery

**Purpose:** Store approved assets, generate thumbnails, update database records.

**Input:** `rawOutput`, `qualityResult`
**Output:** `deliveredAssets`

**Steps:**
1. Upload full-resolution asset to S3 (`/workspaces/{id}/assets/{assetId}/original.{ext}`)
2. Generate thumbnail (512px) and upload to S3
3. Create `Asset` record in PostgreSQL with all metadata
4. Update `PipelineJob` record to `COMPLETED`
5. Emit SSE event to connected browser clients
6. Trigger any registered campaign webhooks

**Asset storage path pattern:**
```
s3://aegis-assets/
  workspaces/{workspaceId}/
    assets/{assetId}/
      original.png
      thumbnail.webp
      metadata.json
```

## Error Handling

All pipeline errors extend `PipelineError`:

```typescript
class PipelineError extends Error {
  constructor(
    public readonly stage: PipelineStage,
    public readonly code: PipelineErrorCode,
    message: string,
    public readonly retryable: boolean,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}
```

Error codes:
- `BRIEF_PARSE_FAILED`
- `DNA_NOT_FOUND`
- `PROMPT_GENERATION_FAILED`
- `PROVIDER_ERROR`
- `PROVIDER_TIMEOUT`
- `QUALITY_GATE_REJECTED`
- `STORAGE_FAILED`

## Pipeline Job Lifecycle

```
QUEUED → RUNNING → COMPLETED
                 ↘ FAILED
                 ↘ AWAITING_REVIEW (human gate)
```
