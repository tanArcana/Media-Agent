import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { getMediaProvider } from '@/modules/media';
import type { PipelineContext } from '../types';
import { PipelineError } from '../types';

export async function generation(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'GENERATION' }, 'Starting media generation');

  if (!ctx.generationPrompt) {
    throw new PipelineError('GENERATION', 'PROVIDER_ERROR', 'generationPrompt is required for generation');
  }

  const provider = getMediaProvider();
  const params = ctx.generationPrompt.technicalParams;

  try {
    const result = await withRetry(
      async () => {
        if (ctx.brief.mediaType === 'VIDEO') {
          return provider.generateVideo({
            prompt: ctx.generationPrompt!.positivePrompt,
            negativePrompt: ctx.generationPrompt!.negativePrompt,
            model: params.model as string | undefined,
            width: params.width as number | undefined,
            height: params.height as number | undefined,
          });
        }

        return provider.generateImage({
          prompt: ctx.generationPrompt!.positivePrompt,
          negativePrompt: ctx.generationPrompt!.negativePrompt,
          model: params.model as string | undefined,
          width: params.width as number | undefined,
          height: params.height as number | undefined,
          steps: params.steps as number | undefined,
          guidanceScale: params.guidanceScale as number | undefined,
        });
      },
      {
        maxAttempts: 3,
        baseDelayMs: 2000,
        maxDelayMs: 8000,
        onRetry: (attempt) => {
          logger.warn({ jobId: ctx.jobId, stage: 'GENERATION', attempt }, 'Retrying media generation');
        },
      },
    );

    const rawOutput = {
      providerJobId: result.providerJobId,
      outputUrls: result.outputUrls,
      generationMetadata: result.metadata,
    };

    logger.info(
      { jobId: ctx.jobId, stage: 'GENERATION', providerJobId: rawOutput.providerJobId, durationMs: Date.now() - start },
      'Media generation complete',
    );

    return {
      ...ctx,
      rawOutput,
      currentStage: 'QUALITY_GATE',
      stageTimings: { ...ctx.stageTimings, GENERATION: Date.now() - start },
    };
  } catch (err) {
    const isTimeout = err instanceof Error && (err.message.includes('timeout') || err.message.includes('Timeout'));
    throw new PipelineError(
      'GENERATION',
      isTimeout ? 'PROVIDER_TIMEOUT' : 'PROVIDER_ERROR',
      `Media generation failed after retries: ${err instanceof Error ? err.message : 'unknown'}`,
      false,
      err,
    );
  }
}
