import { logger } from '@/lib/logger';
import type { PipelineContext } from '../types';

const STAGE_DELAY_MS = 2000;

export async function briefAnalysis(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'BRIEF_ANALYSIS' }, 'Starting brief analysis');

  await new Promise((resolve) => setTimeout(resolve, STAGE_DELAY_MS));

  const analyzedBrief = {
    intent: `Create a ${ctx.brief.mediaType.toLowerCase()} asset: ${ctx.brief.userPrompt}`,
    keyElements: ['subject', 'background', 'lighting', 'color tone'],
    mood: 'professional and engaging',
    suggestedCompositions: ['rule of thirds', 'centered subject'],
  };

  logger.info({ jobId: ctx.jobId, stage: 'BRIEF_ANALYSIS' }, 'Brief analysis complete');

  return {
    ...ctx,
    analyzedBrief,
    currentStage: 'DNA_ALIGNMENT',
    stageTimings: { ...ctx.stageTimings, BRIEF_ANALYSIS: Date.now() - start },
  };
}
