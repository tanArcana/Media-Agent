import { logger } from '@/lib/logger';
import type { PipelineContext } from '../types';
import { PipelineError } from '../types';

const STAGE_DELAY_MS = 2000;

export async function qualityGate(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'QUALITY_GATE' }, 'Starting quality gate');

  if (!ctx.rawOutput) {
    throw new PipelineError(
      'QUALITY_GATE',
      'QUALITY_GATE_REJECTED',
      'rawOutput is required for quality gate',
    );
  }

  await new Promise((resolve) => setTimeout(resolve, STAGE_DELAY_MS));

  // Mock quality scores
  const overallScore = 0.88;
  const brandComplianceScore = 0.85;
  const safetyScore = 0.99;
  const passed = overallScore >= 0.65;
  const requiresHumanReview = overallScore >= 0.65 && overallScore < 0.85;

  const qualityResult = {
    passed,
    overallScore,
    brandComplianceScore,
    safetyScore,
    issues: [],
    requiresHumanReview,
  };

  logger.info(
    {
      jobId: ctx.jobId,
      stage: 'QUALITY_GATE',
      passed,
      overallScore,
      requiresHumanReview,
    },
    'Quality gate complete',
  );

  return {
    ...ctx,
    qualityResult,
    currentStage: 'DELIVERY',
    stageTimings: { ...ctx.stageTimings, QUALITY_GATE: Date.now() - start },
  };
}
