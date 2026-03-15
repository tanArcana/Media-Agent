import { logger } from '@/lib/logger';
import { DEFAULT_DNA } from '@/modules/brand-dna';
import type { PipelineContext } from '../types';

const STAGE_DELAY_MS = 2000;

export async function dnaAlignment(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'DNA_ALIGNMENT' }, 'Starting DNA alignment');

  await new Promise((resolve) => setTimeout(resolve, STAGE_DELAY_MS));

  // In production this loads DNA from DB. For now use DEFAULT_DNA.
  const dna = ctx.dna ?? DEFAULT_DNA;

  const alignment = {
    score: 0.82,
    conflicts: [],
    adjustments: ['Applied brand color palette constraints', 'Matched lighting style'],
  };

  logger.info(
    { jobId: ctx.jobId, stage: 'DNA_ALIGNMENT', score: alignment.score },
    'DNA alignment complete',
  );

  return {
    ...ctx,
    dna,
    dnaAlignment: alignment,
    currentStage: 'PROMPT_ENGINEERING',
    stageTimings: { ...ctx.stageTimings, DNA_ALIGNMENT: Date.now() - start },
  };
}
