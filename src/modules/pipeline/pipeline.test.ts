import { describe, it, expect, vi } from 'vitest';
import { runPipeline } from './pipeline';
import type { PipelineContext, JobStatusUpdate } from './types';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    brandDNA: { findFirst: vi.fn().mockResolvedValue(null) },
    asset: { create: vi.fn().mockResolvedValue({ id: 'test-asset-id' }) },
  },
}));

vi.mock('@/modules/media', () => ({
  getMediaProvider: () => ({
    generateImage: vi.fn().mockResolvedValue({
      providerJobId: 'mock-job',
      outputUrls: ['https://mock/test.png'],
      metadata: { provider: 'mock' },
    }),
    generateVideo: vi.fn().mockResolvedValue({
      providerJobId: 'mock-job',
      outputUrls: ['https://mock/test.mp4'],
      metadata: { provider: 'mock' },
    }),
  }),
}));

vi.mock('@/modules/storage', () => ({
  getStorageProvider: () => ({
    upload: vi.fn().mockResolvedValue('https://mock-storage/uploaded.png'),
    getUrl: vi.fn().mockReturnValue('https://mock-storage/url'),
    delete: vi.fn(),
  }),
}));

function makeContext(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    jobId: 'test-job-1',
    workspaceId: 'test-workspace-1',
    brief: {
      userPrompt: 'A coffee cup on a wooden table',
      mediaType: 'IMAGE',
      aspectRatio: '1:1',
    },
    currentStage: 'BRIEF_ANALYSIS',
    startedAt: new Date(),
    stageTimings: {},
    errors: [],
    ...overrides,
  };
}

describe('runPipeline', () => {
  it('completes all 6 stages successfully', async () => {
    const ctx = makeContext();
    const result = await runPipeline(ctx);

    expect(result.analyzedBrief).toBeDefined();
    expect(result.dna).toBeDefined();
    expect(result.dnaAlignment).toBeDefined();
    expect(result.generationPrompt).toBeDefined();
    expect(result.rawOutput).toBeDefined();
    expect(result.qualityResult).toBeDefined();
    expect(result.deliveredAssets).toBeDefined();
    expect(result.errors).toHaveLength(0);
  }, 30000);

  it('records stage timings for every stage', async () => {
    const result = await runPipeline(makeContext());

    expect(result.stageTimings.BRIEF_ANALYSIS).toBeGreaterThanOrEqual(0);
    expect(result.stageTimings.DNA_ALIGNMENT).toBeGreaterThanOrEqual(0);
    expect(result.stageTimings.PROMPT_ENGINEERING).toBeGreaterThanOrEqual(0);
    expect(result.stageTimings.GENERATION).toBeGreaterThanOrEqual(0);
    expect(result.stageTimings.QUALITY_GATE).toBeGreaterThanOrEqual(0);
    expect(result.stageTimings.DELIVERY).toBeGreaterThanOrEqual(0);
    // Ensure all 6 stages were timed
    expect(Object.keys(result.stageTimings)).toHaveLength(6);
  }, 30000);

  it('emits status updates via callback', async () => {
    const updates: JobStatusUpdate[] = [];
    await runPipeline(makeContext(), {
      onStatusUpdate: (u) => { updates.push(u); },
    });

    // 2 updates per stage (start + end) + 1 final = 13
    expect(updates.length).toBeGreaterThanOrEqual(12);
    expect(updates[updates.length - 1].status).toBe('COMPLETED');
    expect(updates[updates.length - 1].progress).toBe(100);
  }, 30000);

  it('generates correct prompt based on brief', async () => {
    const result = await runPipeline(makeContext());

    expect(result.generationPrompt?.positivePrompt).toContain('coffee cup');
  }, 30000);

  it('includes the correct aspect ratio in technical params', async () => {
    const result = await runPipeline(
      makeContext({ brief: { userPrompt: 'test', mediaType: 'IMAGE', aspectRatio: '16:9' } }),
    );

    // 16:9 uses 1344x768 dimensions
    expect(result.generationPrompt?.technicalParams.width).toBe(1344);
    expect(result.generationPrompt?.technicalParams.height).toBe(768);
  }, 30000);
});
