import { getStorageProvider } from '@/modules/storage';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';
import type { ToolDefinition } from '../types';

function useStubs(): boolean {
  return process.env.USE_STUBS !== 'false';
}

export const storeAssetTool: ToolDefinition = {
  tool: {
    name: 'store_asset',
    description: 'Uploads a media file to S3 and creates a database record.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'URL of the media file to store' },
        workspaceId: { type: 'string', description: 'Workspace ID' },
        campaignId: { type: 'string', description: 'Optional campaign ID' },
        metadata: { type: 'object', description: 'Asset metadata' },
      },
      required: ['url', 'workspaceId', 'metadata'],
    },
  },
  handler: async (input) => {
    const workspaceId = input.workspaceId as string;

    if (useStubs()) {
      const assetId = `asset_${Date.now()}`;
      return {
        assetId,
        storedUrl: `https://mock.storage/workspaces/${workspaceId}/assets/${assetId}/original.png`,
        thumbnailUrl: `https://mock.storage/workspaces/${workspaceId}/assets/${assetId}/thumbnail.webp`,
      };
    }

    const storage = getStorageProvider();
    const sourceUrl = input.url as string;
    const metadata = (input.metadata ?? {}) as Record<string, unknown>;

    // Download the file
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Failed to download asset from ${sourceUrl}: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const assetKey = `workspaces/${workspaceId}/assets/${Date.now()}/original.png`;
    const thumbKey = `workspaces/${workspaceId}/assets/${Date.now()}/thumbnail.webp`;

    const storedUrl = await withRetry(
      () => storage.upload(assetKey, buffer, 'image/png'),
      { maxAttempts: 3, baseDelayMs: 2000 },
    );

    const thumbnailUrl = await withRetry(
      () => storage.upload(thumbKey, buffer, 'image/webp'),
      { maxAttempts: 3, baseDelayMs: 2000 },
    );

    // Create DB record
    const asset = await prisma.asset.create({
      data: {
        workspaceId,
        campaignId: (input.campaignId as string) ?? null,
        type: 'IMAGE',
        status: 'APPROVED',
        originalUrl: storedUrl,
        thumbnailUrl,
        prompt: metadata.prompt as string | undefined,
        negativePrompt: metadata.negativePrompt as string | undefined,
        providerModel: metadata.providerModel as string | undefined,
        brandScore: metadata.brandScore as number | undefined,
        qualityScore: metadata.qualityScore as number | undefined,
      },
    });

    return { assetId: asset.id, storedUrl, thumbnailUrl };
  },
};
