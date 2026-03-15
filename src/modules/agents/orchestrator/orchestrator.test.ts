import { describe, it, expect, beforeEach } from 'vitest';
import type { PipelineContext } from '@/modules/pipeline/types';
import { runOrchestrator } from './orchestrator';

describe('runOrchestrator', () => {
  let ctx: PipelineContext;

  beforeEach(() => {
    process.env.USE_STUBS = 'true';

    ctx = {
      jobId: 'job_test123',
      workspaceId: 'ws_test123',
      brief: {
        userPrompt: 'A professional hero image for our coffee brand',
        mediaType: 'IMAGE',
        aspectRatio: '16:9',
      },
      currentStage: 'BRIEF_ANALYSIS',
      startedAt: new Date(),
      stageTimings: {},
      errors: [],
    };
  });

  it('returns a successful result', async () => {
    const result = await runOrchestrator(ctx);
    expect(result.success).toBe(true);
  });

  it('returns the correct job ID', async () => {
    const result = await runOrchestrator(ctx);
    expect(result.jobId).toBe('job_test123');
  });

  it('returns an asset ID', async () => {
    const result = await runOrchestrator(ctx);
    expect(result.assetId).toBeDefined();
    expect(result.assetId).toContain('asset_');
  });

  it('returns a quality score', async () => {
    const result = await runOrchestrator(ctx);
    expect(result.qualityScore).toBeDefined();
    expect(result.qualityScore).toBeGreaterThan(0);
    expect(result.qualityScore).toBeLessThanOrEqual(1);
  });
});
