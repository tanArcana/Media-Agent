import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import type { PipelineContext } from '../types';
import { PipelineError } from '../types';

const STUB_DELAY_MS = 500;

function useStubs(): boolean {
  return process.env.USE_STUBS !== 'false';
}

export async function briefAnalysis(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'BRIEF_ANALYSIS' }, 'Starting brief analysis');

  if (useStubs()) {
    await new Promise((r) => setTimeout(r, STUB_DELAY_MS));
    const analyzedBrief = {
      intent: `Create a ${ctx.brief.mediaType.toLowerCase()} asset: ${ctx.brief.userPrompt}`,
      keyElements: ['subject', 'background', 'lighting', 'color tone'],
      mood: 'professional and engaging',
      suggestedCompositions: ['rule of thirds', 'centered subject'],
    };
    logger.info({ jobId: ctx.jobId, stage: 'BRIEF_ANALYSIS', stub: true }, 'Brief analysis complete (stub)');
    return {
      ...ctx,
      analyzedBrief,
      currentStage: 'DNA_ALIGNMENT',
      stageTimings: { ...ctx.stageTimings, BRIEF_ANALYSIS: Date.now() - start },
    };
  }

  const client = new Anthropic();

  const analyzedBrief = await withRetry(
    async () => {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are a creative brief analyst. Parse the user's prompt into structured intent.
Return a JSON object with: intent (string), keyElements (string[]), mood (string), suggestedCompositions (string[]).
Only output valid JSON, no markdown.`,
        messages: [
          {
            role: 'user',
            content: `Media type: ${ctx.brief.mediaType}\nUser prompt: ${ctx.brief.userPrompt}`,
          },
        ],
      });

      const text = response.content.find((b) => b.type === 'text');
      if (!text || text.type !== 'text') {
        throw new PipelineError('BRIEF_ANALYSIS', 'BRIEF_PARSE_FAILED', 'No text in Claude response', true);
      }

      return JSON.parse(text.text);
    },
    { maxAttempts: 2, baseDelayMs: 1000 },
  );

  logger.info({ jobId: ctx.jobId, stage: 'BRIEF_ANALYSIS', durationMs: Date.now() - start }, 'Brief analysis complete');

  return {
    ...ctx,
    analyzedBrief,
    currentStage: 'DNA_ALIGNMENT',
    stageTimings: { ...ctx.stageTimings, BRIEF_ANALYSIS: Date.now() - start },
  };
}
