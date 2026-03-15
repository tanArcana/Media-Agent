import { logger } from '@/lib/logger';
import type { PipelineContext } from '../types';
import { PipelineError } from '../types';

const STAGE_DELAY_MS = 2000;

export async function delivery(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'DELIVERY' }, 'Starting delivery');

  if (!ctx.rawOutput || !ctx.qualityResult) {
    throw new PipelineError(
      'DELIVERY',
      'STORAGE_FAILED',
      'rawOutput and qualityResult are required for delivery',
    );
  }

  await new Promise((resolve) => setTimeout(resolve, STAGE_DELAY_MS));

  const assetId = `asset_${ctx.jobId}_${Date.now()}`;

  // Mock S3 upload — in production this uploads to S3 and creates a DB record
  const deliveredAssets = {
    assetId,
    storedUrls: [
      `https://mock.storage/workspaces/${ctx.workspaceId}/assets/${assetId}/original.png`,
    ],
    thumbnailUrl: `https://mock.storage/workspaces/${ctx.workspaceId}/assets/${assetId}/thumbnail.webp`,
    metadata: {
      prompt: ctx.generationPrompt?.positivePrompt,
      negativePrompt: ctx.generationPrompt?.negativePrompt,
      providerModel: ctx.generationPrompt?.technicalParams?.model,
      brandScore: ctx.qualityResult.brandComplianceScore,
      qualityScore: ctx.qualityResult.overallScore,
      aspectRatio: ctx.brief.aspectRatio,
      mediaType: ctx.brief.mediaType,
    },
  };

  logger.info(
    { jobId: ctx.jobId, stage: 'DELIVERY', assetId },
    'Delivery complete',
  );

  return {
    ...ctx,
    deliveredAssets,
    currentStage: 'DELIVERY',
    stageTimings: { ...ctx.stageTimings, DELIVERY: Date.now() - start },
  };
}
