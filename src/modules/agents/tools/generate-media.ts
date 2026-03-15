import type { ToolDefinition } from '../types';

export const generateMediaTool: ToolDefinition = {
  tool: {
    name: 'generate_media',
    description: 'Submits a generation request to the active media provider (FAL or mock).',
    input_schema: {
      type: 'object' as const,
      properties: {
        prompt: { type: 'string', description: 'Positive prompt' },
        negativePrompt: { type: 'string', description: 'Negative prompt' },
        params: { type: 'object', description: 'Generation parameters (model, steps, etc.)' },
      },
      required: ['prompt', 'negativePrompt', 'params'],
    },
  },
  handler: async (input) => {
    // Stub: return mock URLs
    const jobId = `mock_${Date.now()}`;
    return {
      jobId,
      outputUrls: [`https://mock.storage/outputs/${jobId}/result.png`],
    };
  },
};
