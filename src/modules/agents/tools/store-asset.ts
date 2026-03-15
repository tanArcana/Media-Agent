import type { ToolDefinition } from '../types';

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
    const assetId = `asset_${Date.now()}`;
    return {
      assetId,
      storedUrl: `https://mock.storage/workspaces/${input.workspaceId}/assets/${assetId}/original.png`,
      thumbnailUrl: `https://mock.storage/workspaces/${input.workspaceId}/assets/${assetId}/thumbnail.webp`,
    };
  },
};
