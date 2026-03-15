import { describe, it, expect, vi } from 'vitest';
import { runPipeline } from './pipeline';
import type { PipelineContext, JobStatusUpdate } from './types';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
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

    expect(result.stageTimings.BRIEF_ANALYSIS).toBeGreaterThan(0);
    expect(result.stageTimings.DNA_ALIGNMENT).toBeGreaterThan(0);
    expect(result.stageTimings.PROMPT_ENGINEERING).toBeGreaterThan(0);
    expect(result.stageTimings.GENERATION).toBeGreaterThan(0);
    expect(result.stageTimings.QUALITY_GATE).toBeGreaterThan(0);
    expect(result.stageTimings.DELIVERY).toBeGreaterThan(0);
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

    expect(result.generationPrompt?.technicalParams.height).toBe(576);
  }, 30000);
});
