import { z } from 'zod/v4';
import type { BrandDNA } from '@/modules/brand-dna';

export const PipelineStageEnum = z.enum([
  'BRIEF_ANALYSIS',
  'DNA_ALIGNMENT',
  'PROMPT_ENGINEERING',
  'GENERATION',
  'QUALITY_GATE',
  'DELIVERY',
]);
export type PipelineStage = z.infer<typeof PipelineStageEnum>;

export const MediaType = z.enum(['IMAGE', 'VIDEO']);
export type MediaType = z.infer<typeof MediaType>;

export const AspectRatio = z.enum(['1:1', '16:9', '9:16', '4:5']);
export type AspectRatio = z.infer<typeof AspectRatio>;

export type PipelineErrorCode =
  | 'BRIEF_PARSE_FAILED'
  | 'DNA_NOT_FOUND'
  | 'PROMPT_GENERATION_FAILED'
  | 'PROVIDER_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'QUALITY_GATE_REJECTED'
  | 'STORAGE_FAILED';

export class PipelineError extends Error {
  constructor(
    public readonly stage: PipelineStage,
    public readonly code: PipelineErrorCode,
    message: string,
    public readonly retryable: boolean = false,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}

export interface AnalyzedBrief {
  intent: string;
  keyElements: string[];
  mood: string;
  suggestedCompositions: string[];
}

export interface DNAAlignment {
  score: number;
  conflicts: string[];
  adjustments: string[];
}

export interface GenerationPrompt {
  positivePrompt: string;
  negativePrompt: string;
  styleModifiers: string[];
  technicalParams: Record<string, unknown>;
}

export interface RawOutput {
  providerJobId: string;
  outputUrls: string[];
  generationMetadata: Record<string, unknown>;
}

export interface QualityResult {
  passed: boolean;
  overallScore: number;
  brandComplianceScore: number;
  safetyScore: number;
  issues: string[];
  requiresHumanReview: boolean;
}

export interface DeliveredAssets {
  assetId: string;
  storedUrls: string[];
  thumbnailUrl: string;
  metadata: Record<string, unknown>;
}

export interface PipelineContext {
  jobId: string;
  workspaceId: string;
  campaignId?: string;

  brief: {
    userPrompt: string;
    mediaType: z.infer<typeof MediaType>;
    aspectRatio: z.infer<typeof AspectRatio>;
    referenceImageUrls?: string[];
  };

  analyzedBrief?: AnalyzedBrief;
  dna?: BrandDNA;
  dnaAlignment?: DNAAlignment;
  generationPrompt?: GenerationPrompt;
  rawOutput?: RawOutput;
  qualityResult?: QualityResult;
  deliveredAssets?: DeliveredAssets;

  currentStage: PipelineStage;
  startedAt: Date;
  stageTimings: Partial<Record<PipelineStage, number>>;
  errors: PipelineError[];
}

export type StageFunction = (ctx: PipelineContext) => Promise<PipelineContext>;

export type JobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'AWAITING_REVIEW'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface JobStatusUpdate {
  jobId: string;
  status: JobStatus;
  stage?: PipelineStage;
  progress?: number;
  message?: string;
}
