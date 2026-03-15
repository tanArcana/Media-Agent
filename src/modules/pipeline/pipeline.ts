import { logger } from '@/lib/logger';
import type { PipelineContext, StageFunction, JobStatusUpdate, PipelineStage } from './types';
import { PipelineError } from './types';
import { briefAnalysis } from './stages/01-brief-analysis';
import { dnaAlignment } from './stages/02-dna-alignment';
import { promptEngineering } from './stages/03-prompt-engineering';
import { generation } from './stages/04-generation';
import { qualityGate } from './stages/05-quality-gate';
import { delivery } from './stages/06-delivery';

const STAGES: { name: PipelineStage; fn: StageFunction; progress: number }[] = [
  { name: 'BRIEF_ANALYSIS', fn: briefAnalysis, progress: 10 },
  { name: 'DNA_ALIGNMENT', fn: dnaAlignment, progress: 25 },
  { name: 'PROMPT_ENGINEERING', fn: promptEngineering, progress: 40 },
  { name: 'GENERATION', fn: generation, progress: 65 },
  { name: 'QUALITY_GATE', fn: qualityGate, progress: 85 },
  { name: 'DELIVERY', fn: delivery, progress: 100 },
];

export interface PipelineCallbacks {
  onStatusUpdate?: (update: JobStatusUpdate) => void | Promise<void>;
}

export async function runPipeline(
  ctx: PipelineContext,
  callbacks: PipelineCallbacks = {},
): Promise<PipelineContext> {
  const { onStatusUpdate } = callbacks;

  logger.info({ jobId: ctx.jobId }, 'Pipeline started');

  let current = { ...ctx, startedAt: new Date() };

  for (const stage of STAGES) {
    current.currentStage = stage.name;

    await onStatusUpdate?.({
      jobId: current.jobId,
      status: 'RUNNING',
      stage: stage.name,
      progress: stage.progress - 10,
      message: `Running ${stage.name}`,
    });

    try {
      current = await stage.fn(current);
    } catch (err) {
      const pipelineErr =
        err instanceof PipelineError
          ? err
          : new PipelineError(
              stage.name,
              'PROVIDER_ERROR',
              err instanceof Error ? err.message : 'Unknown error',
              false,
              err,
            );

      current.errors.push(pipelineErr);

      logger.error(
        { jobId: current.jobId, stage: stage.name, error: pipelineErr.message },
        'Pipeline stage failed',
      );

      await onStatusUpdate?.({
        jobId: current.jobId,
        status: 'FAILED',
        stage: stage.name,
        message: pipelineErr.message,
      });

      return current;
    }

    await onStatusUpdate?.({
      jobId: current.jobId,
      status: 'RUNNING',
      stage: stage.name,
      progress: stage.progress,
      message: `${stage.name} complete`,
    });
  }

  // Check if human review is needed
  const finalStatus: JobStatusUpdate['status'] =
    current.qualityResult?.requiresHumanReview ? 'AWAITING_REVIEW' : 'COMPLETED';

  await onStatusUpdate?.({
    jobId: current.jobId,
    status: finalStatus,
    progress: 100,
    message: finalStatus === 'COMPLETED' ? 'Pipeline complete' : 'Awaiting human review',
  });

  logger.info(
    {
      jobId: current.jobId,
      status: finalStatus,
      totalMs: Date.now() - current.startedAt.getTime(),
      stageTimings: current.stageTimings,
    },
    'Pipeline finished',
  );

  return current;
}
