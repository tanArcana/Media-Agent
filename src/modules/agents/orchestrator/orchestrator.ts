import type { PipelineContext } from '@/modules/pipeline/types';
import { logger } from '@/lib/logger';
import { runAgent } from '../runner';
import { getToolsForAgent } from '../tools';
import { AgentError } from '../types';

function buildSystemPrompt(ctx: PipelineContext): string {
  return `You are the AEGIS orchestrator agent. You coordinate the 6-stage media generation pipeline.

Current job: ${ctx.jobId}
Workspace: ${ctx.workspaceId}
Media type: ${ctx.brief.mediaType}
Aspect ratio: ${ctx.brief.aspectRatio}
User brief: ${ctx.brief.userPrompt}

Your role is to:
1. Load Brand DNA for the workspace
2. Score brand alignment of the brief
3. Coordinate prompt engineering
4. Trigger media generation
5. Run quality gate on the output
6. Store the final asset

Use your tools to execute each step. Report progress via update_job_status.
Return a final JSON summary when all stages are complete.`;
}

export interface OrchestratorResult {
  success: boolean;
  jobId: string;
  assetId?: string;
  qualityScore?: number;
  error?: string;
}

function buildStubResult(ctx: PipelineContext): OrchestratorResult {
  return {
    success: true,
    jobId: ctx.jobId,
    assetId: `asset_${Date.now()}`,
    qualityScore: 0.87,
  };
}

export async function runOrchestrator(
  ctx: PipelineContext,
): Promise<OrchestratorResult> {
  const stubMode = process.env.USE_STUBS !== 'false';

  if (stubMode) {
    logger.info({ jobId: ctx.jobId }, 'Orchestrator running in stub mode');
    return buildStubResult(ctx);
  }

  const tools = getToolsForAgent([
    'load_brand_dna',
    'score_brand_alignment',
    'generate_media',
    'analyze_image',
    'store_asset',
    'update_job_status',
  ]);

  const result = await runAgent(
    {
      name: 'orchestrator',
      systemPrompt: buildSystemPrompt(ctx),
      tools,
    },
    {
      jobId: ctx.jobId,
      workspaceId: ctx.workspaceId,
      brief: ctx.brief,
    },
  );

  try {
    return JSON.parse(result.text) as OrchestratorResult;
  } catch (err) {
    throw new AgentError(
      'orchestrator',
      'OUTPUT_PARSE_FAILED',
      'Failed to parse orchestrator output as JSON',
      false,
      err,
    );
  }
}
