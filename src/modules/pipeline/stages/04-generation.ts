import { logger } from '@/lib/logger';
import type { PipelineContext } from '../types';
import { PipelineError } from '../types';

const STAGE_DELAY_MS = 2000;

export async function generation(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'GENERATION' }, 'Starting media generation');

  if (!ctx.generationPrompt) {
    throw new PipelineError(
      'GENERATION',
      'PROVIDER_ERROR',
      'generationPrompt is required for generation',
    );
  }

  await new Promise((resolve) => setTimeout(resolve, STAGE_DELAY_MS));

  // Mock provider output — in production this calls FAL
  const rawOutput = {
    providerJobId: `fal_mock_${ctx.jobId}`,
    outputUrls: [`https://mock.storage/outputs/${ctx.jobId}/result.png`],
    generationMetadata: {
      model: ctx.generationPrompt.technicalParams.model,
      seed: Math.floor(Math.random() * 1000000),
      steps: ctx.generationPrompt.technicalParams.steps,
      duration_ms: STAGE_DELAY_MS,
    },
  };

  logger.info(
    { jobId: ctx.jobId, stage: 'GENERATION', providerJobId: rawOutput.providerJobId },
    'Media generation complete',
  );

  return {
    ...ctx,
    rawOutput,
    currentStage: 'QUALITY_GATE',
    stageTimings: { ...ctx.stageTimings, GENERATION: Date.now() - start },
  };
}
