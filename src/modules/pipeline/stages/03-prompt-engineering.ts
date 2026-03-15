import { logger } from '@/lib/logger';
import type { PipelineContext } from '../types';
import { PipelineError } from '../types';

const STAGE_DELAY_MS = 2000;

export async function promptEngineering(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'PROMPT_ENGINEERING' }, 'Starting prompt engineering');

  if (!ctx.analyzedBrief) {
    throw new PipelineError(
      'PROMPT_ENGINEERING',
      'PROMPT_GENERATION_FAILED',
      'analyzedBrief is required for prompt engineering',
    );
  }

  await new Promise((resolve) => setTimeout(resolve, STAGE_DELAY_MS));

  const dna = ctx.dna;
  const mood = dna?.mood?.join(', ') ?? 'professional';
  const style = dna?.visualStyle ?? 'clean photography';
  const forbidden = dna?.forbiddenElements?.join(', ') ?? 'none';

  const generationPrompt = {
    positivePrompt: `${ctx.analyzedBrief.intent}, ${mood}, ${style}, high quality, detailed`,
    negativePrompt: `low quality, blurry, artifacts, ${forbidden}`,
    styleModifiers: [mood, style, dna?.lightingStyle ?? 'natural lighting'],
    technicalParams: {
      model: 'fal-ai/flux/dev',
      steps: 28,
      guidanceScale: 7.5,
      width: ctx.brief.aspectRatio === '9:16' ? 768 : 1024,
      height: ctx.brief.aspectRatio === '16:9' ? 576 : 1024,
    },
  };

  logger.info({ jobId: ctx.jobId, stage: 'PROMPT_ENGINEERING' }, 'Prompt engineering complete');

  return {
    ...ctx,
    generationPrompt,
    currentStage: 'GENERATION',
    stageTimings: { ...ctx.stageTimings, PROMPT_ENGINEERING: Date.now() - start },
  };
}
