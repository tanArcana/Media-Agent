import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { prisma } from '@/lib/prisma';
import { getStorageProvider } from '@/modules/storage';
import type { PipelineContext } from '../types';
import { PipelineError } from '../types';

function isStubMode(): boolean {
  return process.env.USE_STUBS !== 'false';
}

export async function delivery(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'DELIVERY' }, 'Starting delivery');

  if (!ctx.rawOutput || !ctx.qualityResult) {
    throw new PipelineError('DELIVERY', 'STORAGE_FAILED', 'rawOutput and qualityResult are required');
  }

  const mediaType = ctx.brief.mediaType;
  const ext = mediaType === 'VIDEO' ? 'mp4' : 'png';

  if (isStubMode()) {
    await new Promise((r) => setTimeout(r, 300));
    const assetId = `asset_${ctx.jobId}_${Date.now()}`;

    // Create a real DB record even in stub mode
    try {
      const asset = await prisma.asset.create({
        data: {
          workspaceId: ctx.workspaceId,
          campaignId: ctx.campaignId ?? null,
          jobId: ctx.jobId,
          type: mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
          status: ctx.qualityResult.requiresHumanReview ? 'AWAITING_REVIEW' : 'APPROVED',
          originalUrl: ctx.rawOutput.outputUrls[0],
          thumbnailUrl: ctx.rawOutput.outputUrls[0],
          aspectRatio: ctx.brief.aspectRatio,
          prompt: ctx.generationPrompt?.positivePrompt,
          negativePrompt: ctx.generationPrompt?.negativePrompt,
          providerModel: ctx.generationPrompt?.technicalParams?.model as string | undefined,
          brandScore: ctx.qualityResult.brandComplianceScore,
          qualityScore: ctx.qualityResult.overallScore,
        },
      });

      logger.info({ jobId: ctx.jobId, stage: 'DELIVERY', stub: true, assetId: asset.id }, 'Delivery complete (stub)');

      return {
        ...ctx,
        deliveredAssets: {
          assetId: asset.id,
          storedUrls: [ctx.rawOutput.outputUrls[0]],
          thumbnailUrl: ctx.rawOutput.outputUrls[0],
          metadata: {
            prompt: ctx.generationPrompt?.positivePrompt,
            brandScore: ctx.qualityResult.brandComplianceScore,
            qualityScore: ctx.qualityResult.overallScore,
          },
        },
        currentStage: 'DELIVERY',
        stageTimings: { ...ctx.stageTimings, DELIVERY: Date.now() - start },
      };
    } catch {
      // If DB write fails in stub mode, return mock data
      return {
        ...ctx,
        deliveredAssets: {
          assetId,
          storedUrls: [ctx.rawOutput.outputUrls[0]],
          thumbnailUrl: ctx.rawOutput.outputUrls[0],
          metadata: {},
        },
        currentStage: 'DELIVERY',
        stageTimings: { ...ctx.stageTimings, DELIVERY: Date.now() - start },
      };
    }
  }

  // Real implementation: download, upload to S3, create DB record
  const storage = getStorageProvider();
  const sourceUrl = ctx.rawOutput.outputUrls[0];

  // Download the generated asset
  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new PipelineError('DELIVERY', 'STORAGE_FAILED', `Failed to download asset: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  // Upload original
  const assetKey = `workspaces/${ctx.workspaceId}/assets/${ctx.jobId}/original.${ext}`;
  const storedUrl = await withRetry(
    () => storage.upload(assetKey, buffer, mediaType === 'VIDEO' ? 'video/mp4' : 'image/png'),
    { maxAttempts: 3, baseDelayMs: 2000 },
  );

  // Upload thumbnail (for images, just use same file; production would resize)
  const thumbKey = `workspaces/${ctx.workspaceId}/assets/${ctx.jobId}/thumbnail.webp`;
  const thumbnailUrl = await withRetry(
    () => storage.upload(thumbKey, buffer, 'image/webp'),
    { maxAttempts: 3, baseDelayMs: 2000 },
  );

  // Create asset record in DB
  const asset = await prisma.asset.create({
    data: {
      workspaceId: ctx.workspaceId,
      campaignId: ctx.campaignId ?? null,
      jobId: ctx.jobId,
      type: mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      status: ctx.qualityResult.requiresHumanReview ? 'AWAITING_REVIEW' : 'APPROVED',
      originalUrl: storedUrl,
      thumbnailUrl,
      aspectRatio: ctx.brief.aspectRatio,
      prompt: ctx.generationPrompt?.positivePrompt,
      negativePrompt: ctx.generationPrompt?.negativePrompt,
      providerModel: ctx.generationPrompt?.technicalParams?.model as string | undefined,
      brandScore: ctx.qualityResult.brandComplianceScore,
      qualityScore: ctx.qualityResult.overallScore,
    },
  });

  logger.info(
    { jobId: ctx.jobId, stage: 'DELIVERY', assetId: asset.id, durationMs: Date.now() - start },
    'Delivery complete',
  );

  return {
    ...ctx,
    deliveredAssets: {
      assetId: asset.id,
      storedUrls: [storedUrl],
      thumbnailUrl,
      metadata: {
        prompt: ctx.generationPrompt?.positivePrompt,
        negativePrompt: ctx.generationPrompt?.negativePrompt,
        providerModel: ctx.generationPrompt?.technicalParams?.model,
        brandScore: ctx.qualityResult.brandComplianceScore,
        qualityScore: ctx.qualityResult.overallScore,
        aspectRatio: ctx.brief.aspectRatio,
        mediaType: ctx.brief.mediaType,
      },
    },
    currentStage: 'DELIVERY',
    stageTimings: { ...ctx.stageTimings, DELIVERY: Date.now() - start },
  };
}
