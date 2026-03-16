import { logger } from '@/lib/logger';
import type {
  MediaProvider,
  ImageGenerationParams,
  ImageGenerationResult,
  VideoGenerationParams,
  VideoGenerationResult,
} from '../types';

export class FalMediaProvider implements MediaProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    const model = params.model ?? 'fal-ai/flux/dev';

    logger.info({ provider: 'fal', model }, 'Submitting image generation to FAL');

    const body = {
      prompt: params.prompt,
      negative_prompt: params.negativePrompt ?? '',
      image_size: {
        width: params.width ?? 1024,
        height: params.height ?? 1024,
      },
      num_inference_steps: params.steps ?? 28,
      guidance_scale: params.guidanceScale ?? 7.5,
      ...(params.seed !== undefined && { seed: params.seed }),
    };

    const res = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`FAL API error: ${res.status} ${text}`);
    }

    const data = await res.json();

    const outputUrls: string[] = [];
    if (data.images && Array.isArray(data.images)) {
      for (const img of data.images) {
        if (typeof img === 'string') outputUrls.push(img);
        else if (img?.url) outputUrls.push(img.url);
      }
    }

    if (outputUrls.length === 0) {
      throw new Error('FAL returned no images');
    }

    logger.info({ provider: 'fal', model, imageCount: outputUrls.length }, 'FAL image generation complete');

    return {
      providerJobId: data.request_id ?? `fal_${Date.now()}`,
      outputUrls,
      metadata: {
        provider: 'fal',
        model,
        seed: data.seed,
        timings: data.timings,
        hasNsfw: data.has_nsfw_concepts,
      },
    };
  }

  async generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
    const model = params.model ?? 'fal-ai/minimax-video';

    logger.info({ provider: 'fal', model }, 'Submitting video generation to FAL');

    const body = {
      prompt: params.prompt,
      negative_prompt: params.negativePrompt ?? '',
      image_size: {
        width: params.width ?? 1280,
        height: params.height ?? 720,
      },
    };

    const res = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`FAL API error: ${res.status} ${text}`);
    }

    const data = await res.json();

    const outputUrls: string[] = [];
    if (data.video?.url) outputUrls.push(data.video.url);

    if (outputUrls.length === 0) {
      throw new Error('FAL returned no video');
    }

    return {
      providerJobId: data.request_id ?? `fal_${Date.now()}`,
      outputUrls,
      metadata: {
        provider: 'fal',
        model,
        timings: data.timings,
      },
    };
  }
}
