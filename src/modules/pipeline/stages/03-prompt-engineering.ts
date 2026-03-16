import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import type { PipelineContext } from '../types';
import { PipelineError } from '../types';

const STUB_DELAY_MS = 500;
const ASPECT_RATIO_DIMS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:5': { width: 896, height: 1120 },
};

function isStubMode(): boolean {
  return process.env.USE_STUBS !== 'false';
}

export async function promptEngineering(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  logger.info({ jobId: ctx.jobId, stage: 'PROMPT_ENGINEERING' }, 'Starting prompt engineering');

  if (!ctx.analyzedBrief) {
    throw new PipelineError('PROMPT_ENGINEERING', 'PROMPT_GENERATION_FAILED', 'analyzedBrief is required');
  }

  const dna = ctx.dna;
  const dims = ASPECT_RATIO_DIMS[ctx.brief.aspectRatio] ?? ASPECT_RATIO_DIMS['1:1'];

  if (isStubMode()) {
    await new Promise((r) => setTimeout(r, STUB_DELAY_MS));
    const mood = dna?.mood?.join(', ') ?? 'professional';
    const style = dna?.visualStyle ?? 'clean photography';
    const forbidden = dna?.forbiddenElements?.join(', ') ?? 'none';
    const generationPrompt = {
      positivePrompt: `${ctx.analyzedBrief.intent}, ${mood}, ${style}, high quality, detailed`,
      negativePrompt: `low quality, blurry, artifacts, ${forbidden}`,
      styleModifiers: [mood, style, dna?.lightingStyle ?? 'natural lighting'],
      technicalParams: { model: 'fal-ai/flux/dev', steps: 28, guidanceScale: 7.5, ...dims },
    };
    logger.info({ jobId: ctx.jobId, stage: 'PROMPT_ENGINEERING', stub: true }, 'Prompt engineering complete (stub)');
    return {
      ...ctx,
      generationPrompt,
      currentStage: 'GENERATION',
      stageTimings: { ...ctx.stageTimings, PROMPT_ENGINEERING: Date.now() - start },
    };
  }

  const client = new Anthropic();

  const dnaContext = dna
    ? `Brand DNA:
- Colors: ${JSON.stringify((dna as Record<string, unknown>).colorPalette)}
- Style: ${dna.visualStyle}
- Mood: ${Array.isArray(dna.mood) ? dna.mood.join(', ') : dna.mood}
- Lighting: ${dna.lightingStyle}
- Forbidden: ${dna.forbiddenElements?.join(', ') ?? 'none'}`
    : 'No brand DNA available.';

  const generationPrompt = await withRetry(
    async () => {
      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        system: `You are an expert AI image/video prompt engineer specializing in brand-consistent media generation.
Craft a precise generation prompt that captures the user's intent and enforces brand DNA constraints.

${dnaContext}

Adjustments from DNA alignment: ${ctx.dnaAlignment?.adjustments?.join('; ') ?? 'none'}

Return a JSON object with:
- positivePrompt: detailed positive prompt string
- negativePrompt: negative prompt string
- styleModifiers: string array of style modifiers applied
- technicalParams: { model: "fal-ai/flux/dev", steps: 28, guidanceScale: 7.5, width: ${dims.width}, height: ${dims.height} }

Only output valid JSON, no markdown.`,
        messages: [
          {
            role: 'user',
            content: `Analyzed brief:\n${JSON.stringify(ctx.analyzedBrief)}\n\nMedia type: ${ctx.brief.mediaType}\nAspect ratio: ${ctx.brief.aspectRatio}`,
          },
        ],
      });

      const text = response.content.find((b) => b.type === 'text');
      if (!text || text.type !== 'text') {
        throw new PipelineError('PROMPT_ENGINEERING', 'PROMPT_GENERATION_FAILED', 'No text in response', true);
      }

      return JSON.parse(text.text);
    },
    { maxAttempts: 2, baseDelayMs: 2000 },
  );

  logger.info({ jobId: ctx.jobId, stage: 'PROMPT_ENGINEERING', durationMs: Date.now() - start }, 'Prompt engineering complete');

  return {
    ...ctx,
    generationPrompt,
    currentStage: 'GENERATION',
    stageTimings: { ...ctx.stageTimings, PROMPT_ENGINEERING: Date.now() - start },
  };
}
