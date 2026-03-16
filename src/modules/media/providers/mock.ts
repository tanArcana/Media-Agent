import { logger } from '@/lib/logger';
import type {
  MediaProvider,
  ImageGenerationParams,
  ImageGenerationResult,
  VideoGenerationParams,
  VideoGenerationResult,
} from '../types';

const MOCK_DELAY_MS = 500;

const FIXTURE_IMAGES: Record<string, string> = {
  '1:1': '/fixtures/sample-1x1.png',
  '16:9': '/fixtures/sample-16x9.png',
  '9:16': '/fixtures/sample-9x16.png',
  '4:5': '/fixtures/sample-4x5.png',
  default: '/fixtures/sample-1x1.png',
};

export class MockMediaProvider implements MediaProvider {
  private failRate: number;

  constructor(failRate = 0) {
    this.failRate = failRate;
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    logger.info({ provider: 'mock', model: params.model }, 'Mock image generation');

    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));

    if (Math.random() < this.failRate) {
      throw new Error('Mock provider: simulated generation failure');
    }

    const ratio = this.detectAspectRatio(params.width, params.height);
    const fixtureUrl = FIXTURE_IMAGES[ratio] ?? FIXTURE_IMAGES.default;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    return {
      providerJobId: `mock_img_${Date.now()}`,
      outputUrls: [`${appUrl}${fixtureUrl}`],
      metadata: {
        provider: 'mock',
        model: params.model ?? 'mock-flux',
        seed: params.seed ?? Math.floor(Math.random() * 999999),
        steps: params.steps ?? 28,
        durationMs: MOCK_DELAY_MS,
      },
    };
  }

  async generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
    logger.info({ provider: 'mock', model: params.model }, 'Mock video generation');

    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));

    if (Math.random() < this.failRate) {
      throw new Error('Mock provider: simulated generation failure');
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    return {
      providerJobId: `mock_vid_${Date.now()}`,
      outputUrls: [`${appUrl}/fixtures/sample-video.mp4`],
      metadata: {
        provider: 'mock',
        model: params.model ?? 'mock-video',
        durationSeconds: params.durationSeconds ?? 5,
        durationMs: MOCK_DELAY_MS,
      },
    };
  }

  private detectAspectRatio(width?: number, height?: number): string {
    if (!width || !height) return 'default';
    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.1) return '1:1';
    if (Math.abs(ratio - 16 / 9) < 0.1) return '16:9';
    if (Math.abs(ratio - 9 / 16) < 0.1) return '9:16';
    if (Math.abs(ratio - 4 / 5) < 0.1) return '4:5';
    return 'default';
  }
}
