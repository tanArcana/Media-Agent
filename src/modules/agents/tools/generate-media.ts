import { getMediaProvider } from '@/modules/media';
import { withRetry } from '@/lib/retry';
import type { ToolDefinition } from '../types';

function isStubMode(): boolean {
  return process.env.USE_STUBS !== 'false';
}

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
    if (isStubMode()) {
      const jobId = `mock_${Date.now()}`;
      return { jobId, outputUrls: [`https://mock.storage/outputs/${jobId}/result.png`] };
    }

    const provider = getMediaProvider();
    const params = (input.params ?? {}) as Record<string, unknown>;

    const result = await withRetry(
      () =>
        provider.generateImage({
          prompt: input.prompt as string,
          negativePrompt: input.negativePrompt as string,
          model: params.model as string | undefined,
          width: params.width as number | undefined,
          height: params.height as number | undefined,
          steps: params.steps as number | undefined,
          guidanceScale: params.guidanceScale as number | undefined,
        }),
      { maxAttempts: 3, baseDelayMs: 2000 },
    );

    return { jobId: result.providerJobId, outputUrls: result.outputUrls };
  },
};
